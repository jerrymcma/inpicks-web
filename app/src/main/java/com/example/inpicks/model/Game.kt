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
    val isFree: Boolean = false
)
