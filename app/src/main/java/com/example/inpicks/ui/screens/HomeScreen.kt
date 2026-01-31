package com.example.inpicks.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.inpicks.data.AuthRepository
import com.example.inpicks.data.PicksRepository
import com.example.inpicks.model.Game
import kotlinx.coroutines.launch
import androidx.compose.foundation.clickable
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import kotlinx.coroutines.delay

private val sports = listOf("NFL", "NBA")

private fun pickKey(gameId: String, predictionType: String) = "$gameId_$predictionType"

@Composable
fun HomeScreen(
    modifier: Modifier = Modifier,
    onNavigateToSubscription: () -> Unit,
    onNavigateToRecord: () -> Unit
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
    val winRate by PicksRepository.winRate.collectAsState()
    val userPicks by PicksRepository.userPicks.collectAsState()
    val scope = rememberCoroutineScope() // For launching suspend functions

    var isRefreshing by remember { mutableStateOf(false) }
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = {
            scope.launch {
                isRefreshing = true
                PicksRepository.refreshUserProfile()
                isRefreshing = false
            }
        }
    )

    var selectedGame by remember { mutableStateOf<Game?>(null) }
    var currentPredictionType by remember { mutableStateOf("MONEYLINE") }
    var viewedPrediction by remember { mutableStateOf<String?>(null) }
    var isGenerating by remember { mutableStateOf(false) }
    var isLockingIn by remember { mutableStateOf(false) }
    var showAuthScreen by remember { mutableStateOf(false) }
    var gameToLockAfterAuth by remember { mutableStateOf<Game?>(null) }
    var showLockedPrediction by remember { mutableStateOf(false) }

    // Define a common spacing for between major UI elements
    val itemSpacing = 8.dp
    val cardInternalPadding = 12.dp // Consistent internal padding for cards

    // Initial load of user profile if logged in or session restored
    LaunchedEffect(currentUser) {
        if (currentUser != null) {
            PicksRepository.refreshUserProfile()
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier
            .fillMaxSize()
            .padding(bottom = 48.dp)
        ) {
            Spacer(modifier = Modifier.height(28.dp)) // Top padding for header
            // New Row for Logo and Record link
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = itemSpacing), // Added vertical padding to the row itself
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = buildAnnotatedString {
                        withStyle(style = SpanStyle(color = Color(0xFFFFEB3B))) {
                            append("In")
                        }
                        withStyle(style = SpanStyle(color = MaterialTheme.colorScheme.onPrimaryContainer)) {
                            append("picks")
                        }
                    },
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Record",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold, 
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.clickable { onNavigateToRecord() }
                )
            }
            Spacer(modifier = Modifier.height(3.dp)) // Space below HeaderRow
            PerformanceHeader(
                modifier = Modifier.padding(horizontal = 16.dp), // Apply horizontal padding here
                numberOfLockedPicks = userPicks.size,
                winRate = if (userPicks.any { it.gameStatus == "completed" }) 
                         "${String.format("%.1f", winRate)}%" else "--%",
                onRecordClick = { onNavigateToRecord() },
                cardInternalPadding = cardInternalPadding
            )
            Spacer(modifier = Modifier.height(itemSpacing * 2)) // Space below PerformanceHeader
            FreePicksStatus(
                modifier = Modifier.padding(horizontal = 16.dp), // Apply horizontal padding here
                isLoggedIn = currentUser != null,
                freePicksRemaining = freePicks,
                isSubscribed = isSubscribed,
                onSignIn = { showAuthScreen = true },
                onGoUnlimited = onNavigateToSubscription,
                cardInternalPadding = cardInternalPadding
            )
            Spacer(modifier = Modifier.height(itemSpacing)) // Space below FreePicksStatus
            SportSelector(
                selectedSport,
                onSelect = { selectedSport = it },
                modifier = Modifier.padding(horizontal = 16.dp), // Apply horizontal padding here
                itemSpacing = itemSpacing // Pass common spacing for internal use
            )
            Spacer(modifier = Modifier.height(itemSpacing)) // Space below SportSelector
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .pullRefresh(pullRefreshState)
            ) {
                GamesList(
                    sport = selectedSport,
                    games = games.value,
                    lockedPickKeys = unlockedGames,
                    predictions = predictions,
                    freePicksRemaining = freePicks,
                    onViewClick = { game ->
                        selectedGame = game
                        currentPredictionType = "MONEYLINE"
                        isGenerating = true
                        showLockedPrediction = false
                        scope.launch {
                            val prediction = PicksRepository.generatePrediction(
                                game.id,
                                selectedSport,
                                game.homeTeam,
                                game.awayTeam,
                                "MONEYLINE"
                            )
                            viewedPrediction = prediction
                            isGenerating = false
                        }
                    },
                    onSpreadViewClick = { game ->
                        selectedGame = game
                        currentPredictionType = "SPREAD"
                        isGenerating = true
                        showLockedPrediction = false
                        scope.launch {
                            val prediction = PicksRepository.generatePrediction(
                                game.id,
                                selectedSport,
                                game.homeTeam,
                                game.awayTeam,
                                "SPREAD",
                                game.homeSpread,
                                game.awaySpread
                            )
                            viewedPrediction = prediction
                            isGenerating = false
                        }
                    },
                    onOverUnderViewClick = { game ->
                        selectedGame = game
                        currentPredictionType = "OVER_UNDER"
                        isGenerating = true
                        showLockedPrediction = false
                        scope.launch {
                            val prediction = PicksRepository.generatePrediction(
                                game.id,
                                selectedSport,
                                game.homeTeam,
                                game.awayTeam,
                                "OVER_UNDER",
                                overUnder = game.overUnder
                            )
                            viewedPrediction = prediction
                            isGenerating = false
                        }
                    },
                    onLockedPickClick = { game, predictionType, prediction ->
                        selectedGame = game
                        currentPredictionType = predictionType
                        viewedPrediction = prediction
                        showLockedPrediction = true
                    },
                    onNavigateToSubscription = onNavigateToSubscription,
                    listContentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp), // Use parameter for LazyColumn content padding
                    listVerticalArrangement = Arrangement.spacedBy(4.dp) // Use parameter for spacing between LazyColumn items
                )
                PullRefreshIndicator(
                    refreshing = isRefreshing,
                    state = pullRefreshState,
                    modifier = Modifier.align(Alignment.TopCenter)
                )
            }
        }

        if (selectedGame != null) {
            val currentPickIsLocked = unlockedGames.contains(pickKey(selectedGame.id, currentPredictionType))
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
                        if (isGenerating) "Analyzing ${when(currentPredictionType) {
                            "SPREAD" -> "Spread"
                            "OVER_UNDER" -> "Total"
                            else -> "Matchup"
                        }}..." 
                        else if (showLockedPrediction) "Your Locked In Pick"
                        else "InPicks ${when(currentPredictionType) {
                            "SPREAD" -> "Spread"
                            "OVER_UNDER" -> "Total"
                            else -> "Moneyline"
                        }} Prediction"
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
                    if (!isGenerating && viewedPrediction != null) {
                        if (showLockedPrediction || currentPickIsLocked) {
                            Button(onClick = {}, enabled = false) {
                                Text("Locked In")
                            }
                        } else {
                            Button(
                                onClick = {
                                    if (currentUser == null) {
                                        gameToLockAfterAuth = selectedGame
                                        selectedGame = null
                                        showAuthScreen = true
                                    } else if (freePicks > 0) {
                                        isLockingIn = true
                                        scope.launch {
                                            PicksRepository.setCurrentPredictionType(currentPredictionType)
                                            val success = PicksRepository.lockInGame(
                                                selectedGame!!.id,
                                                selectedSport,
                                                viewedPrediction!!
                                            )
                                            isLockingIn = false
                                            if (success) {
                                                selectedGame = null
                                                viewedPrediction = null
                                                if (!isSubscribed && freePicks <= 1) {
                                                    onNavigateToSubscription()
                                                }
                                            } else {
                                                selectedGame = null
                                                viewedPrediction = null
                                            }
                                        }
                                    } else if (isSubscribed) {
                                        isLockingIn = true
                                        scope.launch {
                                            PicksRepository.setCurrentPredictionType(currentPredictionType)
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
                                    } else {
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
        Footer(
            modifier = Modifier.align(Alignment.BottomCenter),
            isLoggedIn = currentUser != null,
            onLogout = {
                scope.launch {
                    AuthRepository.signOut()
                }
            }
        )
    }
}

@Composable
private fun Footer(modifier: Modifier = Modifier, isLoggedIn: Boolean, onLogout: () -> Unit) {
    val uriHandler = LocalUriHandler.current
    val footerTextStyle = MaterialTheme.typography.bodySmall.copy(
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isLoggedIn) {
            Text(
                text = "Logout",
                style = footerTextStyle,
                modifier = Modifier
                    .clickable(onClick = onLogout)
                    .padding(8.dp)
            )
        }
        Text(
            text = "Privacy",
            style = footerTextStyle,
            modifier = Modifier
                .clickable { uriHandler.openUri("https://www.inpicks.com/privacy") }
                .padding(8.dp)
        )
        Text(
            text = "Terms",
            style = footerTextStyle,
            modifier = Modifier
                .clickable { uriHandler.openUri("https://www.inpicks.com/terms") }
                .padding(8.dp)
        )
        Text(
            text = "Web App",
            style = footerTextStyle,
            modifier = Modifier
                .clickable { uriHandler.openUri("https://app.inpicks.com/") }
                .padding(8.dp)
        )
    }
}

@Composable
fun PerformanceHeader(modifier: Modifier = Modifier, numberOfLockedPicks: Int, winRate: String, onRecordClick: () -> Unit, cardInternalPadding: Dp) {
    val itemSpacing = 7.dp // Consistent spacing for internal elements
    Card(
        modifier = modifier.fillMaxWidth(), 
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(
            modifier = Modifier
                .padding(2.dp) 
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(itemSpacing) 
        ) {
            Text(
                text = buildAnnotatedString {
                    withStyle(style = SpanStyle(color = Color(0xFFFFEB3B))) {
                        append("In")
                    }
                    withStyle(style = SpanStyle(color = MaterialTheme.colorScheme.onPrimaryContainer)) {
                        append("picks Performance")
                    }
                },
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "$winRate Win Rate", 
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Text(
                text = "$numberOfLockedPicks Picks", 
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
fun FreePicksStatus(
    modifier: Modifier = Modifier, 
    isLoggedIn: Boolean,
    freePicksRemaining: Int,
    isSubscribed: Boolean,
    onSignIn: () -> Unit,
    onGoUnlimited: () -> Unit,
    nextRefillAtMillis: Long? = null,
    cardInternalPadding: Dp 
) {
    // Hide entirely when subscribed to avoid occupying space
    if (isSubscribed) return

    val onContainer = MaterialTheme.colorScheme.onSecondaryContainer

    // Drive a ticking clock if we have a target refill time
    var nowMillis by remember(nextRefillAtMillis, freePicksRemaining) { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(nextRefillAtMillis) {
        if (nextRefillAtMillis != null) {
            while (true) {
                val now = System.currentTimeMillis()
                nowMillis = now
                val remaining = (nextRefillAtMillis - nowMillis).coerceAtLeast(0L)
                if (remaining <= 0L) break
                val alignToSecond = (1000 - (now % 1000)).coerceIn(200, 1000)
                delay(alignToSecond)
            }
        }
    }

    Card(
        modifier = modifier.fillMaxWidth(), 
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(2.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!isLoggedIn) {
                Button(onClick = onSignIn) {
                    Text("Sign In")
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "to use 3 free picks",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = onContainer
                )
            } else {
                val clamped = freePicksRemaining.coerceIn(0, 3)
                val countdownSuffix = nextRefillAtMillis?.let { target ->
                    val remaining = (target - nowMillis).coerceAtLeast(0L)
                    " · Resets in ${formatDuration(remaining)}"
                } ?: ""
                Text(
                    text = "Free picks left: $clamped$countdownSuffix",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = onContainer
                )
                Button(onClick = onGoUnlimited) {
                    Text("Go Unlimited")
                }
            }
        }
    }
}

private fun formatDuration(millis: Long): String {
    val totalSeconds = millis / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60

    return if (hours > 0) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%d:%02d".format(minutes, seconds)
    }
}

@Composable
fun SportSelector(
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier, 
    itemSpacing: Dp // Pass itemSpacing from HomeScreen
) {
    val buttonHeight = 48.dp // Default Material3 button height
    val customHeight = buttonHeight * 1.5f // 1.5 times taller

    Row(
        modifier = modifier 
            .fillMaxWidth()
            .padding(vertical = itemSpacing), 
        horizontalArrangement = Arrangement.spacedBy(itemSpacing) // Use itemSpacing for horizontal arrangement as well
    ) {
        sports.forEach { sport ->
            FilterChip(
                selected = sport == selected,
                onClick = { onSelect(sport) },
                label = {
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (sport) {
                                "NFL" -> "🏈"
                                "NBA" -> "🏀"
                                else -> "🏈"
                            },
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = sport,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .height(customHeight),
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
    lockedPickKeys: Set<String>,
    predictions: Map<String, String>,
    freePicksRemaining: Int,
    onViewClick: (Game) -> Unit,
    onSpreadViewClick: (Game) -> Unit,
    onOverUnderViewClick: (Game) -> Unit,
    onLockedPickClick: (Game, String, String) -> Unit,
    onNavigateToSubscription: () -> Unit,
    listContentPadding: PaddingValues,
    listVerticalArrangement: Arrangement.Vertical
) {
    LazyColumn(
        contentPadding = listContentPadding,
        verticalArrangement = listVerticalArrangement
    ) {
        item {
            Text(
                text = "Upcoming $sport Games",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
        }
        items(games) { game ->
            GameCard(
                game = game,
                lockedPickKeys = lockedPickKeys,
                predictions = predictions,
                freePicksRemaining = freePicksRemaining,
                onViewClick = { onViewClick(game) },
                onSpreadViewClick = { onSpreadViewClick(game) },
                onOverUnderViewClick = { onOverUnderViewClick(game) },
                onLockedPickClick = { predictionType, predictionText ->
                    onLockedPickClick(game, predictionType, predictionText)
                },
                onNavigateToSubscription = onNavigateToSubscription
            )
        }
    }
}

@Composable
fun GameCard(
    game: Game,
    lockedPickKeys: Set<String>,
    predictions: Map<String, String>,
    freePicksRemaining: Int,
    onViewClick: () -> Unit,
    onSpreadViewClick: () -> Unit,
    onOverUnderViewClick: () -> Unit,
    onLockedPickClick: (Game, String, String) -> Unit,
    onNavigateToSubscription: () -> Unit
) {
    val bottomPadding = 16.dp
    val moneylineKey = pickKey(game.id, "MONEYLINE")
    val spreadKey = pickKey(game.id, "SPREAD")
    val overUnderKey = pickKey(game.id, "OVER_UNDER")
    val moneylineLocked = lockedPickKeys.contains(moneylineKey)
    val spreadLocked = lockedPickKeys.contains(spreadKey)
    val overUnderLocked = lockedPickKeys.contains(overUnderKey)
    val moneylinePrediction = predictions[moneylineKey]
    val spreadPrediction = predictions[spreadKey]
    val overUnderPrediction = predictions[overUnderKey]
    val hasSpread = game.homeSpread != null && game.awaySpread != null
    val hasOverUnder = game.overUnder != null
    val clampedFreePicks = freePicksRemaining.coerceIn(0, 3)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(
                start = 16.dp,
                top = 16.dp,
                end = 16.dp,
                bottom = bottomPadding
            )
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${game.awayTeam}\n@ ${game.homeTeam}",
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
            
            // Chart Icons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Start
            ) {
                Text(
                    text = "📈",
                    fontSize = 24.sp,
                    color = Color.Red
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "📊",
                    fontSize = 24.sp,
                    color = Color.Red
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Betting Lines Display
            if (game.homeSpread != null && game.awaySpread != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Spread: ${game.awayTeam} ${if(game.awaySpread!! > 0) "+" else ""}${game.awaySpread}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                        maxLines = 1
                    )
                    Text(
                        text = "${game.homeTeam} ${if(game.homeSpread!! > 0) "+" else ""}${game.homeSpread}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                        maxLines = 1
                    )
                }
            }
            
            game.overUnder?.let { total ->
                Text(
                    text = "Total: O/U $total",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Start
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        if (moneylineLocked && moneylinePrediction != null) {
                            onLockedPickClick(game, "MONEYLINE", moneylinePrediction)
                        } else {
                            onViewClick()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (moneylineLocked) MaterialTheme.colorScheme.primary else Color(0xFF4CAF50)
                    )
                ) {
                    Text(
                        text = if (moneylineLocked) "Locked In" else "Pick Winner",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                if (hasSpread || hasOverUnder) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (hasSpread) {
                            Button(
                                onClick = {
                                    if (spreadLocked && spreadPrediction != null) {
                                        onLockedPickClick(game, "SPREAD", spreadPrediction)
                                    } else {
                                        onSpreadViewClick()
                                    }
                                },
                                modifier = if (hasOverUnder) Modifier.weight(1f) else Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (spreadLocked) MaterialTheme.colorScheme.primary else Color(0xFF2196F3)
                                )
                            ) {
                                Text(
                                    text = if (spreadLocked) "Locked In" else "Points Spread",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }

                        if (hasOverUnder) {
                            Button(
                                onClick = {
                                    if (overUnderLocked && overUnderPrediction != null) {
                                        onLockedPickClick(game, "OVER_UNDER", overUnderPrediction)
                                    } else {
                                        onOverUnderViewClick()
                                    }
                                },
                                modifier = if (hasSpread) Modifier.weight(1f) else Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (overUnderLocked) MaterialTheme.colorScheme.primary else Color(0xFF2196F3)
                                )
                            ) {
                                Text(
                                    text = if (overUnderLocked) "Locked In" else "Over/Under",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }

                Text(
                    text = "$clampedFreePicks of 3 free picks",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                if (freePicksRemaining <= 0) {
                    Spacer(modifier = Modifier.height(4.dp))
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