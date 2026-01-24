package com.example.inpicks.data

import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.functions.functions
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

object PaymentRepository {

    @Serializable
    data class PaymentSheetResponse(
        @SerialName("paymentIntent") val paymentIntent: String,
        @SerialName("ephemeralKey") val ephemeralKey: String,
        @SerialName("customer") val customer: String,
        @SerialName("publishableKey") val publishableKey: String
    )

    suspend fun fetchPaymentSheetParams(amount: Long, currency: String = "usd"): Result<PaymentSheetResponse> {
        return try {
            // --- MOCK MODE ENABLED ---
            // Simulating a successful backend response so you can test the UI flow immediately.
            // When you have deployed the Supabase Function, uncomment the real code below.
            
            kotlinx.coroutines.delay(1000) // Simulate network delay
            Result.success(
                PaymentSheetResponse(
                    paymentIntent = "pi_mock_intent_secret",
                    ephemeralKey = "ek_mock_secret",
                    customer = "cus_mock_id",
                    publishableKey = com.example.inpicks.BuildConfig.STRIPE_PUBLISHABLE_KEY
                )
            )

            /* REAL IMPLEMENTATION (Uncomment after deploying function)
            val response = SupabaseClient.client.functions.invoke("create-payment-intent", 
                mapOf("amount" to amount, "currency" to currency)
            ).decode<PaymentSheetResponse>()
            Result.success(response)
            */
            
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
