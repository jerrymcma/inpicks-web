package com.example.inpicks.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

enum class PredictionType {
    MONEYLINE,     // Pick the winner
    SPREAD,        // Beat the point spread
    OVER_UNDER,    // Total points over/under
    PARLAY         // Combined multiple bets
}

@Serializable
data class Profile(
    @SerialName("id") val id: String, // Matches auth.uid()
    @SerialName("email") val email: String?,
    @SerialName("free_picks_remaining") val freePicksRemaining: Int = 3,
    @SerialName("is_subscribed") val isSubscribed: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class UserPick(
    @SerialName("id") val id: String? = null, // Auto-generated ID
    @SerialName("user_id") val userId: String,
    @SerialName("game_id") val gameId: String,
    @SerialName("sport") val sport: String,
    @SerialName("prediction_type") val predictionType: String = "MONEYLINE", // MONEYLINE, SPREAD, OVER_UNDER, PARLAY
    @SerialName("prediction_text") val predictionText: String, // Store the generated analysis
    @SerialName("predicted_outcome") val predictedOutcome: String? = null, // Team/value we predicted
    @SerialName("actual_outcome") val actualOutcome: String? = null, // Actual result
    @SerialName("is_correct") val isCorrect: Boolean? = null, // Whether our prediction was correct
    @SerialName("game_final_score") val gameFinalScore: String? = null, // Final score for reference
    @SerialName("spread_line") val spreadLine: Double? = null, // The spread line at time of pick
    @SerialName("over_under_line") val overUnderLine: Double? = null, // The O/U line at time of pick
    @SerialName("game_status") val gameStatus: String = "pending", // 'pending', 'completed', 'cancelled'
    @SerialName("created_at") val createdAt: String? = null
)
