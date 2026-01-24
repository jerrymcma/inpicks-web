package com.example.inpicks.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

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
    @SerialName("prediction_text") val predictionText: String, // Store the generated analysis
    @SerialName("created_at") val createdAt: String? = null
)
