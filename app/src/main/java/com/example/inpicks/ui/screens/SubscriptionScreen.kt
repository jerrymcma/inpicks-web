package com.example.inpicks.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.style.TextAlign
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import com.stripe.android.paymentsheet.rememberPaymentSheet
import com.example.inpicks.data.PaymentRepository
import com.example.inpicks.data.PicksRepository
import kotlinx.coroutines.launch

@Composable
fun SubscriptionScreen(
    onDismiss: () -> Unit,
    onSubscribeSuccess: () -> Unit // Callback when payment succeeds
) {
    val scope = rememberCoroutineScope()
    val paymentSheet = rememberPaymentSheet(paymentResultCallback = { result ->
        when (result) {
            is PaymentSheetResult.Completed -> {
                // Payment succeeded
                scope.launch {
                    PicksRepository.updateSubscriptionStatus(true)
                    onSubscribeSuccess()
                }
            }
            is PaymentSheetResult.Canceled -> {
                // User canceled
            }
            is PaymentSheetResult.Failed -> {
                // Payment failed
                // In a real app, you'd show a Snackbar or error message here
            }
        }
    })

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }


    fun startCheckout(amount: Long) {
        isLoading = true
        errorMessage = null
        scope.launch {
            val result = PaymentRepository.fetchPaymentSheetParams(amount)
            isLoading = false
            
            result.onSuccess { params ->
                val customerConfig = PaymentSheet.CustomerConfiguration(
                    id = params.customer,
                    ephemeralKeySecret = params.ephemeralKey
                )
                paymentSheet.presentWithPaymentIntent(
                    params.paymentIntent,
                    PaymentSheet.Configuration(
                        merchantDisplayName = "Inpicks",
                        customer = customerConfig
                    )
                )
            }.onFailure {
                errorMessage = "Payment init failed: ${it.message}"
            }
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Unlock Unlimited Picks",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Get access to all AI-powered sports predictions with an 80%+ win rate.",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(32.dp))

            if (isLoading) {
                 CircularProgressIndicator()
                 Spacer(modifier = Modifier.height(16.dp))
            }

            if (errorMessage != null) {
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            Button(
                onClick = { startCheckout(1900) }, // $19.00 in cents
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Monthly Plan - $19/mo", color = MaterialTheme.colorScheme.onPrimary)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = { startCheckout(14900) }, // $149.00 in cents
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("Yearly Plan - $149/yr (Save 35%)", color = MaterialTheme.colorScheme.onSecondary)
            }
            Spacer(modifier = Modifier.height(24.dp))
            TextButton(onClick = onDismiss) {
                Text("Not now")
            }
        }
    }
}
