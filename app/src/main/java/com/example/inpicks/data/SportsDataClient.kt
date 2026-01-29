package com.example.inpicks.data

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

object SportsDataClient {
    // API Key loaded from local.properties via BuildConfig
    private const val API_KEY = com.example.inpicks.BuildConfig.ODDS_API_KEY
    private const val BASE_URL = "https://api.the-odds-api.com/v4/sports"

    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
                isLenient = true
            })
        }
    }

    suspend fun getUpcomingGames(sport: String): List<SportsGame> {
        val sportKey = when (sport) {
            "NFL" -> "americanfootball_nfl"
            "NBA" -> "basketball_nba"
            "MLB" -> "baseball_mlb"
            else -> "americanfootball_nfl"
        }

        return try {
            // Fetch multiple markets: h2h (moneyline), spreads, totals
            client.get("$BASE_URL/$sportKey/odds/?apiKey=$API_KEY&regions=us&markets=h2h,spreads,totals").body()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}

@Serializable
data class SportsGame(
    val id: String,
    @SerialName("sport_key") val sportKey: String,
    @SerialName("commence_time") val commenceTime: String,
    @SerialName("home_team") val homeTeam: String,
    @SerialName("away_team") val awayTeam: String,
    val bookmakers: List<Bookmaker> = emptyList()
) {
    // Helper functions to extract betting lines
    fun getSpreadLine(): Pair<Double, Double>? {
        val spreadMarket = bookmakers.firstOrNull()?.markets?.find { it.key == "spreads" }
        val homeOutcome = spreadMarket?.outcomes?.find { it.name == homeTeam }
        val awayOutcome = spreadMarket?.outcomes?.find { it.name == awayTeam }
        
        return if (homeOutcome?.point != null && awayOutcome?.point != null) {
            Pair(homeOutcome.point, awayOutcome.point)
        } else null
    }
    
    fun getOverUnderLine(): Double? {
        val totalsMarket = bookmakers.firstOrNull()?.markets?.find { it.key == "totals" }
        return totalsMarket?.outcomes?.firstOrNull()?.point
    }
    
    fun getMoneylineOdds(): Pair<Int, Int>? {
        val h2hMarket = bookmakers.firstOrNull()?.markets?.find { it.key == "h2h" }
        val homeOutcome = h2hMarket?.outcomes?.find { it.name == homeTeam }
        val awayOutcome = h2hMarket?.outcomes?.find { it.name == awayTeam }
        
        return if (homeOutcome?.price != null && awayOutcome?.price != null) {
            Pair(homeOutcome.price.toInt(), awayOutcome.price.toInt())
        } else null
    }
}

@Serializable
data class Bookmaker(
    val key: String,
    val title: String,
    val markets: List<Market>
)

@Serializable
data class Market(
    val key: String,
    val outcomes: List<Outcome>
)

@Serializable
data class Outcome(
    val name: String,
    val price: Double,
    val point: Double? = null // For spreads and totals
)
