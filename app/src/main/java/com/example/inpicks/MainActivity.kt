package com.example.inpicks

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import com.example.inpicks.data.PicksRepository
import com.example.inpicks.ui.screens.HomeScreen
import com.example.inpicks.ui.screens.SubscriptionScreen
import com.example.inpicks.ui.screens.RecordScreen
import com.example.inpicks.ui.theme.InpicksTheme

import com.stripe.android.PaymentConfiguration
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Stripe
        PaymentConfiguration.init(
            applicationContext,
            BuildConfig.STRIPE_PUBLISHABLE_KEY
        )

        enableEdgeToEdge()
        setContent {
            InpicksTheme {
                var showSubscription by remember { mutableStateOf(false) }
                var showRecord by remember { mutableStateOf(false) }
                var homeScreenKey by remember { mutableStateOf(UUID.randomUUID()) }

                when {
                    showSubscription -> {
                        SubscriptionScreen(
                            onDismiss = { 
                                showSubscription = false 
                                homeScreenKey = UUID.randomUUID()
                            },
                            onSubscribeSuccess = {
                                // Subscription state is updated in Repository
                                showSubscription = false
                            }
                        )
                    }
                    showRecord -> {
                        RecordScreen(
                            onNavigateBack = { showRecord = false }
                        )
                    }
                    else -> {
                        key(homeScreenKey) {
                            HomeScreen(
                                onNavigateToSubscription = { showSubscription = true },
                                onNavigateToRecord = { showRecord = true }
                            )
                        }
                    }
                }
            }
        }
    }
}
