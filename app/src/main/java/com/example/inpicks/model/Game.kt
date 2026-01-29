package com.example.inpicks.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Game(
    val id: String,
    @SerialName("home_team")
    val homeTeam: String,
    @SerialName("away_team")
    val awayTeam: String,
    val time: String,
    val prediction: String,
    val confidence: Int,
    @SerialName("is_free")
    val isFree: Boolean = false,
    // Betting lines
    @SerialName("home_spread")
    val homeSpread: Double? = null, // e.g., -7.5 (home favored by 7.5)
    @SerialName("away_spread") 
    val awaySpread: Double? = null, // e.g., +7.5 (away getting 7.5 points)
    @SerialName("over_under")
    val overUnder: Double? = null, // e.g., 52.5 total points
    @SerialName("home_odds")
    val homeOdds: Int? = null, // e.g., -150 (favorite)
    @SerialName("away_odds")
    val awayOdds: Int? = null, // e.g., +130 (underdog)
    // Spread and total predictions
    val spreadPrediction: String? = null, // AI's spread pick
    val overUnderPrediction: String? = null // AI's O/U pick
)
