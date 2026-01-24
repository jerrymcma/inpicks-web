package com.example.inpicks.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.inpicks.data.AuthRepository
import com.example.inpicks.data.PicksRepository
import com.example.inpicks.model.Game
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    modifier: Modifier = Modifier,
    onNavigateToSubscription: () -> Unit
) {
    var selectedSport by remember { mutableStateOf("NFL") }
    // Using produceState to handle suspend function for Supabase call
    val games = produceState<List<Game>>(initialValue = emptyList(), key1 = selectedSport) {
        value = PicksRepository.getGames(selectedSport)
    }
    val unlockedGames by PicksRepository.unlockedGames.collectAsState()
    val predictions by PicksRepository.predictions.collectAsState()
    val freePicks by PicksRepository.freePicksRemaining.collectAsState()
    val isSubscribed by PicksRepository.isSubscribed.collectAsState()
    val currentUser by AuthRepository.currentUser.collectAsState()
    val scope = rememberCoroutineScope() // For launching suspend functions

    var selectedGame by remember { mutableStateOf<Game?>(null) }
    var viewedPrediction by remember { mutableStateOf<String?>(null) }
    var isGenerating by remember { mutableStateOf(false) }
    var isLockingIn by remember { mutableStateOf(false) }
    var showAuthScreen by remember { mutableStateOf(false) }
    var gameToLockAfterAuth by remember { mutableStateOf<Game?>(null) }
    var showLockedPrediction by remember { mutableStateOf(false) }

    // Initial load of user profile if logged in or session restored
    LaunchedEffect(currentUser) {
        if (currentUser != null) {
            PicksRepository.refreshUserProfile()
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            PerformanceHeader()
            SportSelector(selectedSport) { selectedSport = it }
            FreePicksStatus(
                isLoggedIn = currentUser != null,
                freePicksRemaining = freePicks,
                isSubscribed = isSubscribed,
                onSignIn = { showAuthScreen = true },
                onGoUnlimited = onNavigateToSubscription
            )
            Spacer(modifier = Modifier.height(8.dp))
            GamesList(
                sport = selectedSport,
                games = games.value,
                unlockedGames = unlockedGames,
                predictions = predictions,
                freePicksRemaining = freePicks,
                onViewClick = { game ->
                    selectedGame = game
                    isGenerating = true
                    showLockedPrediction = false
                    scope.launch {
                        val prediction = PicksRepository.generatePrediction(
                            game.id,
                            selectedSport,
                            game.homeTeam,
                            game.awayTeam
                        )
                        viewedPrediction = prediction
                        isGenerating = false
                    }
                },
                onLockedPickClick = { game, prediction ->
                    selectedGame = game
                    viewedPrediction = prediction
                    showLockedPrediction = true
                },
                onNavigateToSubscription = onNavigateToSubscription
            )
        }

        if (selectedGame != null) {
            AlertDialog(
                onDismissRequest = {
                    if (!isGenerating && !isLockingIn) {
                        selectedGame = null
                        viewedPrediction = null
                        showLockedPrediction = false
                    }
                },
                title = {
                    Text(
                        if (isGenerating) "Analyzing Matchup..." 
                        else if (showLockedPrediction) "Your Locked In Pick"
                        else "InPicks AI Prediction"
                    )
                },
                text = {
                    Column {
                        if (isGenerating) {
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .wrapContentWidth(Alignment.CenterHorizontally)
                            )
                        } else if (viewedPrediction != null) {
                            Text(
                                text = viewedPrediction!!,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                },
                confirmButton = {
                    if (!isGenerating && viewedPrediction != null && !showLockedPrediction && !unlockedGames.contains(selectedGame!!.id)) {
                        Button(
                            onClick = {
                                if (currentUser == null) {
                                    gameToLockAfterAuth = selectedGame
                                    selectedGame = null
                                    showAuthScreen = true
                                } else if (freePicks > 0) { // User has free picks remaining
                                    isLockingIn = true
                                    scope.launch {
                                        val success = PicksRepository.lockInGame(
                                            selectedGame!!.id,
                                            selectedSport,
                                            viewedPrediction!!
                                        )
                                        isLockingIn = false
                                        if (success) {
                                            selectedGame = null
                                            viewedPrediction = null
                                            // Check if we should navigate to subscription (local state is already updated)
                                            if (!isSubscribed && freePicks <= 1) {
                                                onNavigateToSubscription()
                                            }
                                        } else {
                                            // Handle error, but don't navigate to subscription if it's not a subscription issue
                                            selectedGame = null
                                            viewedPrediction = null
                                        }
                                    }
                                } else if (isSubscribed) { // User is subscribed
                                    isLockingIn = true
                                    scope.launch {
                                        val success = PicksRepository.lockInGame(
                                            selectedGame!!.id,
                                            selectedSport,
                                            viewedPrediction!!
                                        )
                                        isLockingIn = false
                                        if (success) {
                                            selectedGame = null
                                            viewedPrediction = null
                                        } else {
                                            selectedGame = null
                                            viewedPrediction = null
                                            onNavigateToSubscription()
                                        }
                                    }
                                } else { // No free picks left and not subscribed, navigate to subscription
                                    selectedGame = null
                                    viewedPrediction = null
                                    onNavigateToSubscription()
                                }
                            },
                            enabled = !isLockingIn
                        ) {
                            if (isLockingIn) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            } else {
                                Text("Lock In Pick")
                            }
                        }
                    }
                },
                dismissButton = {
                    if (!isGenerating && !isLockingIn) {
                        TextButton(onClick = {
                            selectedGame = null
                            viewedPrediction = null
                            showLockedPrediction = false
                        }) {
                            Text("Close")
                        }
                    }
                }
            )
        }

        if (showAuthScreen) {
            AuthScreen(
                onDismiss = {
                    showAuthScreen = false
                    gameToLockAfterAuth = null
                },
                onAuthSuccess = {
                    showAuthScreen = false
                    scope.launch {
                        val profile = PicksRepository.refreshUserProfile()
                        if (profile != null) {
                            // After auth, lock in the game
                            gameToLockAfterAuth?.let { game ->
                                viewedPrediction?.let { prediction ->
                                    val success = PicksRepository.lockInGame(
                                        game.id,
                                        selectedSport,
                                        prediction,
                                        profile
                                    )
                                    if (success) {
                                        // Check if we should navigate to subscription (local state is already updated)
                                        if (!profile.isSubscribed && profile.freePicksRemaining <= 1) {
                                            onNavigateToSubscription()
                                        }
                                    } else {
                                        // Clear state before navigating to subscription
                                        onNavigateToSubscription()
                                    }
                                    // Clear temporary state variables
                                    selectedGame = null
                                    viewedPrediction = null
                                    gameToLockAfterAuth = null
                                }
                            }
                        }
                    }
                }
            )
        }
    }
}

@Composable
fun PerformanceHeader() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Inpicks AI Performance",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "82% Win Rate",
                style = MaterialTheme.typography.displayMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Text(
                text = "Last 30 Days",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
fun SportSelector(selected: String, onSelect: (String) -> Unit) {
    val sports = listOf("NFL", "NBA")
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        sports.forEach { sport ->
            FilterChip(
                selected = sport == selected,
                onClick = { onSelect(sport) },
                label = { Text(sport) },
                modifier = Modifier.weight(1f),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    }
}

@Composable
fun GamesList(
    sport: String,
    games: List<Game>,
    unlockedGames: Set<String>,
    predictions: Map<String, String>,
    freePicksRemaining: Int,
    onViewClick: (Game) -> Unit,
    onLockedPickClick: (Game, String) -> Unit,
    onNavigateToSubscription: () -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Upcoming $sport Games",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }
        items(games) { game ->
            GameCard(
                game = game,
                isLockedIn = unlockedGames.contains(game.id),
                predictionText = predictions[game.id],
                freePicksRemaining = freePicksRemaining,
                onViewClick = { onViewClick(game) },
                onLockedPickClick = { 
                    predictions[game.id]?.let { onLockedPickClick(game, it) }
                },
                onNavigateToSubscription = onNavigateToSubscription
            )
        }
    }
}

@Composable
fun GameCard(
    game: Game,
    isLockedIn: Boolean,
    predictionText: String?,
    freePicksRemaining: Int,
    onViewClick: () -> Unit,
    onLockedPickClick: () -> Unit,
    onNavigateToSubscription: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${game.awayTeam} @ ${game.homeTeam}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = game.time,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )
            Spacer(modifier = Modifier.height(12.dp))

            if (isLockedIn) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Button(
                        onClick = onLockedPickClick,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text("Locked In Pick ✓")
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$freePicksRemaining of 3 free picks",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            } else {
                if (freePicksRemaining > 0) {
                    Button(
                        onClick = onViewClick,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                    ) {
                        Text("View Pick", color = MaterialTheme.colorScheme.onSecondary)
                    }
                } else {
                    Button(
                        onClick = onNavigateToSubscription,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Unlock Unlimited Picks", color = MaterialTheme.colorScheme.onPrimary)
                    }
                }
            }
        }
    }
}
