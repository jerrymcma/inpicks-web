package com.example.inpicks.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.inpicks.data.PicksRepository
import com.example.inpicks.model.UserPick

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordScreen(
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val userPicks by PicksRepository.userPicks.collectAsState()
    val winRate by PicksRepository.winRate.collectAsState()
    val moneylineWinRate by PicksRepository.moneylineWinRate.collectAsState()
    val spreadWinRate by PicksRepository.spreadWinRate.collectAsState()
    val overUnderWinRate by PicksRepository.overUnderWinRate.collectAsState()
    
    val completedPicks = userPicks.filter { it.gameStatus == "completed" }
    val pendingPicks = userPicks.filter { it.gameStatus == "pending" }
    val correctPicks = completedPicks.count { it.isCorrect == true }
    val incorrectPicks = completedPicks.count { it.isCorrect == false }

    Column(modifier = modifier.fillMaxSize()) {
        // Top App Bar
        TopAppBar(
            title = { 
                Text(
                    "Pick History",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                ) 
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Summary Card
            item {
                SummaryCard(
                    totalPicks = userPicks.size,
                    completedPicks = completedPicks.size,
                    pendingPicks = pendingPicks.size,
                    correctPicks = correctPicks,
                    incorrectPicks = incorrectPicks,
                    winRate = winRate,
                    moneylineWinRate = moneylineWinRate,
                    spreadWinRate = spreadWinRate,
                    overUnderWinRate = overUnderWinRate
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Completed Picks Section
            if (completedPicks.isNotEmpty()) {
                item {
                    Text(
                        text = "Completed Games",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
                items(completedPicks.sortedByDescending { it.createdAt }) { pick ->
                    PickResultCard(pick = pick)
                }
                
                if (pendingPicks.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }

            // Pending Picks Section
            if (pendingPicks.isNotEmpty()) {
                item {
                    Text(
                        text = "Pending Games",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
                items(pendingPicks.sortedByDescending { it.createdAt }) { pick ->
                    PickResultCard(pick = pick)
                }
            }

            // Empty state
            if (userPicks.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No picks yet.\nLock in your first prediction!",
                            style = MaterialTheme.typography.bodyLarge,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SummaryCard(
    totalPicks: Int,
    completedPicks: Int,
    pendingPicks: Int,
    correctPicks: Int,
    incorrectPicks: Int,
    winRate: Double,
    moneylineWinRate: Double,
    spreadWinRate: Double,
    overUnderWinRate: Double
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Overall Performance",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    value = totalPicks.toString(),
                    label = "Total Picks",
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                StatItem(
                    value = if (completedPicks > 0) "${String.format("%.1f", winRate)}%" else "--",
                    label = "Overall Win Rate",
                    color = if (winRate >= 50.0) Color(0xFF4CAF50) else Color(0xFFF44336)
                )
                StatItem(
                    value = "$correctPicks-$incorrectPicks",
                    label = "W-L Record",
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Prediction Type Breakdown
            Text(
                text = "Win Rate by Prediction Type",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    value = if (moneylineWinRate > 0) "${String.format("%.1f", moneylineWinRate)}%" else "--",
                    label = "🏆 Moneyline",
                    color = if (moneylineWinRate >= 50.0) Color(0xFF4CAF50) else Color(0xFFF44336)
                )
                StatItem(
                    value = if (spreadWinRate > 0) "${String.format("%.1f", spreadWinRate)}%" else "--",
                    label = "📊 Spread",
                    color = if (spreadWinRate >= 50.0) Color(0xFF4CAF50) else Color(0xFFF44336)
                )
                StatItem(
                    value = if (overUnderWinRate > 0) "${String.format("%.1f", overUnderWinRate)}%" else "--",
                    label = "🎯 O/U Total",
                    color = if (overUnderWinRate >= 50.0) Color(0xFF4CAF50) else Color(0xFFF44336)
                )
            }
        }
    }
}

@Composable
fun StatItem(
    value: String,
    label: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
        )
    }
}

@Composable
fun PickResultCard(pick: UserPick) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = pick.sport,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = when(pick.predictionType) {
                                "SPREAD" -> "📊 Spread"
                                "OVER_UNDER" -> "🎯 O/U"
                                else -> "🏆 Moneyline"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = "Game ID: ${pick.gameId}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                // Status Icon
                when (pick.gameStatus) {
                    "completed" -> {
                        Icon(
                            imageVector = if (pick.isCorrect == true) Icons.Default.CheckCircle else Icons.Default.Close,
                            contentDescription = if (pick.isCorrect == true) "Correct" else "Incorrect",
                            tint = if (pick.isCorrect == true) Color(0xFF4CAF50) else Color(0xFFF44336),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    "pending" -> {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Pending",
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Prediction
            Text(
                text = "Predicted: ${pick.predictedOutcome ?: "Unknown"}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            if (pick.gameStatus == "completed") {
                Text(
                    text = "Actual: ${pick.actualOutcome ?: "Unknown"}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                pick.gameFinalScore?.let { score ->
                    Text(
                        text = "Final Score: $score",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Prediction Analysis (truncated)
            Text(
                text = pick.predictionText.take(100) + if (pick.predictionText.length > 100) "..." else "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}