package com.example.inpicks.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width

@Composable
fun FreePicksStatus(
    isLoggedIn: Boolean,
    freePicksRemaining: Int,
    isSubscribed: Boolean,
    onSignIn: () -> Unit,
    onGoUnlimited: () -> Unit,
    nextRefillAtMillis: Long? = null
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
                val remaining = nextRefillAtMillis - now
                if (remaining <= 0L) break
                val alignToSecond = (1000 - (now % 1000)).coerceIn(200, 1000)
                delay(alignToSecond)
            }
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 12.dp),
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
