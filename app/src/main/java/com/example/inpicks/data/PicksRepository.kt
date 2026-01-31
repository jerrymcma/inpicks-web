package com.example.inpicks.data

import com.example.inpicks.model.Game
import com.example.inpicks.model.Profile
import com.example.inpicks.model.UserPick
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.*

object PicksRepository {
    private val _freePicksRemaining = MutableStateFlow(3)
    val freePicksRemaining: StateFlow<Int> = _freePicksRemaining.asStateFlow()

    private val _isSubscribed = MutableStateFlow(false)
    val isSubscribed: StateFlow<Boolean> = _isSubscribed.asStateFlow()

    private val _unlockedGames = MutableStateFlow<Set<String>>(emptySet())
    val unlockedGames: StateFlow<Set<String>> = _unlockedGames.asStateFlow()

    // Store real predictions in memory (and sync with DB)
    private val _predictions = MutableStateFlow<Map<String, String>>(emptyMap())
    val predictions: StateFlow<Map<String, String>> = _predictions.asStateFlow()

    // Store user picks with full details
    private val _userPicks = MutableStateFlow<List<UserPick>>(emptyList())
    val userPicks: StateFlow<List<UserPick>> = _userPicks.asStateFlow()

    // Win rate calculation - overall and by type
    private val _winRate = MutableStateFlow<Double>(0.0)
    val winRate: StateFlow<Double> = _winRate.asStateFlow()
    
    private val _moneylineWinRate = MutableStateFlow<Double>(0.0)
    val moneylineWinRate: StateFlow<Double> = _moneylineWinRate.asStateFlow()
    
    private val _spreadWinRate = MutableStateFlow<Double>(0.0)
    val spreadWinRate: StateFlow<Double> = _spreadWinRate.asStateFlow()
    
    private val _overUnderWinRate = MutableStateFlow<Double>(0.0)
    val overUnderWinRate: StateFlow<Double> = _overUnderWinRate.asStateFlow()

    private fun formatGameTime(commenceTime: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            val date = inputFormat.parse(commenceTime) ?: return commenceTime

            val calendar = Calendar.getInstance(TimeZone.getTimeZone("America/Chicago"))
            calendar.time = date

            val today = Calendar.getInstance(TimeZone.getTimeZone("America/Chicago"))

            if (calendar.get(Calendar.YEAR) == today.get(Calendar.YEAR) &&
                calendar.get(Calendar.DAY_OF_YEAR) == today.get(Calendar.DAY_OF_YEAR)
            ) {
                val timeFormat = SimpleDateFormat("h:mm a", Locale.US)
                timeFormat.timeZone = TimeZone.getTimeZone("America/Chicago")
                "Today, ${timeFormat.format(date)} (CST)"
            } else {
                val outputFormat = SimpleDateFormat("M/d/yy, h:mm a", Locale.US)
                outputFormat.timeZone = TimeZone.getTimeZone("America/Chicago")
                "${outputFormat.format(date)} (CST)"
            }
        } catch (e: Exception) {
            commenceTime
        }
    }

    private fun calculateWinRate() {
        val completedPicks = _userPicks.value.filter { it.gameStatus == "completed" && it.isCorrect != null }
        
        // Overall win rate
        if (completedPicks.isNotEmpty()) {
            val correctPicks = completedPicks.count { it.isCorrect == true }
            _winRate.value = (correctPicks.toDouble() / completedPicks.size) * 100
        } else {
            _winRate.value = 0.0
        }
        
        // Moneyline win rate
        val moneylinePicks = completedPicks.filter { it.predictionType == "MONEYLINE" }
        if (moneylinePicks.isNotEmpty()) {
            val correctMoneyline = moneylinePicks.count { it.isCorrect == true }
            _moneylineWinRate.value = (correctMoneyline.toDouble() / moneylinePicks.size) * 100
        } else {
            _moneylineWinRate.value = 0.0
        }
        
        // Spread win rate
        val spreadPicks = completedPicks.filter { it.predictionType == "SPREAD" }
        if (spreadPicks.isNotEmpty()) {
            val correctSpread = spreadPicks.count { it.isCorrect == true }
            _spreadWinRate.value = (correctSpread.toDouble() / spreadPicks.size) * 100
        } else {
            _spreadWinRate.value = 0.0
        }
        
        // Over/Under win rate
        val overUnderPicks = completedPicks.filter { it.predictionType == "OVER_UNDER" }
        if (overUnderPicks.isNotEmpty()) {
            val correctOverUnder = overUnderPicks.count { it.isCorrect == true }
            _overUnderWinRate.value = (correctOverUnder.toDouble() / overUnderPicks.size) * 100
        } else {
            _overUnderWinRate.value = 0.0
        }
    }

    suspend fun refreshUserProfile(): Profile? {
        val userId = AuthRepository.getUserId() ?: return null
        var userProfile: Profile? = null
        try {
            val result = SupabaseClient.client.from("profiles")
                .select {
                    filter {
                        eq("id", userId)
                    }
                }.decodeList<Profile>()

            if (result.isNotEmpty()) {
                val profile = result.first()
                _freePicksRemaining.value = profile.freePicksRemaining
                _isSubscribed.value = profile.isSubscribed
                userProfile = profile
            } else {
                val newProfile = Profile(id = userId, email = AuthRepository.currentUser.value?.email)
                try {
                    SupabaseClient.client.from("profiles").insert(newProfile)
                    userProfile = newProfile
                    // Explicitly set the state for the new user, as this is the initial load
                    _freePicksRemaining.value = newProfile.freePicksRemaining
                    _isSubscribed.value = newProfile.isSubscribed
                } catch (e: Exception) {
                    // Ignore if it already exists (race condition)
                }
            }

            // Fetch unlocked games for this user
            val unlocked = SupabaseClient.client.from("user_picks")
                .select {
                    filter {
                        eq("user_id", userId)
                    }
                }.decodeList<UserPick>()

            _unlockedGames.value = unlocked.map { "${it.gameId}_${it.predictionType}" }.toSet()
            _predictions.value = unlocked.associate { "${it.gameId}_${it.predictionType}" to it.predictionText }
            _userPicks.value = unlocked
            calculateWinRate()

        } catch (e: Exception) {
            e.printStackTrace()
        }
        return userProfile
    }

    suspend fun generatePrediction(
        gameId: String, 
        sport: String, 
        homeTeam: String, 
        awayTeam: String,
        predictionType: String = "MONEYLINE",
        homeSpread: Double? = null,
        awaySpread: Double? = null,
        overUnder: Double? = null
    ): String {
        // Create unique key for this prediction type
        val predictionKey = "${gameId}_${predictionType}"
        
        // Check if already generated for this type
        _predictions.value[predictionKey]?.let { return it }
        
        // Generate new prediction with Gemini
        return try {
            val analysis = when (predictionType) {
                "SPREAD" -> GeminiClient.analyzeSpread(sport, homeTeam, awayTeam, homeSpread ?: 0.0, awaySpread ?: 0.0)
                "OVER_UNDER" -> GeminiClient.analyzeOverUnder(sport, homeTeam, awayTeam, overUnder ?: 0.0)
                else -> GeminiClient.analyzeMatchup(sport, homeTeam, awayTeam)
            }
            
            // Store the prediction with type-specific key
            _predictions.value = _predictions.value + (predictionKey to analysis)
            analysis
        } catch (e: Exception) {
            e.printStackTrace()
            "Unable to generate prediction. Please try again."
        }
    }

    // Helper function to extract predicted outcome from prediction text
    private fun extractPredictedOutcome(predictionText: String, homeTeam: String, awayTeam: String, predictionType: String = "MONEYLINE"): String {
        val text = predictionText.lowercase()
        return when (predictionType) {
            "MONEYLINE" -> {
                when {
                    text.contains(homeTeam.lowercase()) && !text.contains(awayTeam.lowercase()) -> homeTeam
                    text.contains(awayTeam.lowercase()) && !text.contains(homeTeam.lowercase()) -> awayTeam
                    text.contains("home") -> homeTeam
                    text.contains("away") -> awayTeam
                    else -> "Unknown"
                }
            }
            "SPREAD" -> {
                when {
                    text.contains("pick:") -> {
                        // Extract team from "Pick: TeamName -7.5" format
                        val pickLine = text.substringAfter("pick:").trim()
                        when {
                            pickLine.contains(homeTeam.lowercase()) -> homeTeam
                            pickLine.contains(awayTeam.lowercase()) -> awayTeam
                            else -> "Unknown"
                        }
                    }
                    text.contains(homeTeam.lowercase()) -> homeTeam
                    text.contains(awayTeam.lowercase()) -> awayTeam
                    else -> "Unknown"
                }
            }
            "OVER_UNDER" -> {
                when {
                    text.contains("over") -> "Over"
                    text.contains("under") -> "Under"
                    else -> "Unknown"
                }
            }
            else -> "Unknown"
        }
    }

    // Add a variable to track current prediction type
    private var currentPredictionType = "MONEYLINE"
    
    fun setCurrentPredictionType(type: String) {
        currentPredictionType = type
    }

    @Serializable
    data class LockInPickParams(
        val game_id: String,
        val sport: String,
        val prediction_type: String,
        val prediction_text: String,
        val predicted_outcome: String,
        val spread_line: Double?,
        val over_under_line: Double?
    )

    suspend fun lockInGame(gameId: String, sport: String, predictionText: String): Boolean {
        if (AuthRepository.getUserId() == null) return false

        // Check if already locked in for this prediction type
        val pickKey = "${gameId}_${currentPredictionType}"
        if (_unlockedGames.value.contains(pickKey)) {
            return true
        }

        if (_isSubscribed.value || _freePicksRemaining.value > 0) {
            try {
                // Get game info to extract predicted outcome
                val games = getGames(sport)
                val game = games.find { it.id == gameId }
                val predictedOutcome = game?.let {
                    extractPredictedOutcome(predictionText, it.homeTeam, it.awayTeam, currentPredictionType)
                } ?: "Unknown"

                val params = LockInPickParams(
                    game_id = gameId,
                    sport = sport,
                    prediction_type = currentPredictionType,
                    prediction_text = predictionText,
                    predicted_outcome = predictedOutcome,
                    spread_line = game?.homeSpread,
                    over_under_line = game?.overUnder
                )

                SupabaseClient.client.functions.invoke("lock_in_pick", body = params)

                // After successful invocation, refresh the user profile to get the new state
                refreshUserProfile()

                return true
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
        return false
    }

    suspend fun lockInGame(gameId: String, sport: String, predictionText: String, profile: Profile): Boolean {
        // This overloaded function can be simplified now or removed if the calling logic is updated.
        // For now, it will also use the RPC function.
        if (profile.isSubscribed || profile.freePicksRemaining > 0) {
            try {
                val games = getGames(sport)
                val game = games.find { it.id == gameId }
                val predictedOutcome = game?.let {
                    extractPredictedOutcome(predictionText, it.homeTeam, it.awayTeam, currentPredictionType)
                } ?: "Unknown"

                val params = LockInPickParams(
                    game_id = gameId,
                    sport = sport,
                    prediction_type = currentPredictionType,
                    prediction_text = predictionText,
                    predicted_outcome = predictedOutcome,
                    spread_line = game?.homeSpread,
                    over_under_line = game?.overUnder
                )

                SupabaseClient.client.functions.invoke("lock_in_pick", body = params)
                refreshUserProfile()
                return true
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
        return false
    }

    suspend fun updateSubscriptionStatus(subscribed: Boolean) {
        val userId = AuthRepository.getUserId() ?: return
        try {
            SupabaseClient.client.from("profiles").update(
                { set("is_subscribed", subscribed) }
            ) {
                filter { eq("id", userId) }
            }
            _isSubscribed.value = subscribed
        } catch(e: Exception) {
            e.printStackTrace()
        }
    }

    // Function to manually update game result (for testing/admin purposes)
    suspend fun updateGameResult(gameId: String, actualOutcome: String, finalScore: String? = null) {
        val userId = AuthRepository.getUserId() ?: return
        
        try {
            // Find the user pick
            val userPick = _userPicks.value.find { it.gameId == gameId && it.userId == userId }
            
            userPick?.let { pick ->
                val isCorrect = pick.predictedOutcome == actualOutcome
                
                // Update in database
                SupabaseClient.client.from("user_picks").update(
                    {
                        set("actual_outcome", actualOutcome)
                        set("is_correct", isCorrect)
                        set("game_status", "completed")
                        finalScore?.let { set("game_final_score", it) }
                    }
                ) {
                    filter { 
                        eq("user_id", userId)
                        eq("game_id", gameId)
                    }
                }
                
                // Update local state
                val updatedPicks = _userPicks.value.map { 
                    if (it.gameId == gameId && it.userId == userId) {
                        it.copy(
                            actualOutcome = actualOutcome,
                            isCorrect = isCorrect,
                            gameStatus = "completed",
                            gameFinalScore = finalScore
                        )
                    } else it
                }
                _userPicks.value = updatedPicks
                calculateWinRate()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun getGames(sport: String): List<Game> {
        return try {
            // Fetch live schedule from The-Odds-API
            val upcomingGames = SportsDataClient.getUpcomingGames(sport)
            
            // Convert to Game objects
            upcomingGames.map { sportsGame ->
                val spreadLine = sportsGame.getSpreadLine()
                val overUnder = sportsGame.getOverUnderLine()
                val odds = sportsGame.getMoneylineOdds()
                
                Game(
                    id = sportsGame.id,
                    homeTeam = sportsGame.homeTeam,
                    awayTeam = sportsGame.awayTeam,
                    time = formatGameTime(sportsGame.commenceTime),
                    prediction = "Tap to Analyze", 
                    confidence = 0,
                    isFree = false,
                    homeSpread = spreadLine?.first,
                    awaySpread = spreadLine?.second,
                    overUnder = overUnder,
                    homeOdds = odds?.first,
                    awayOdds = odds?.second
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback to mock data on error
            List(10) { i ->
                Game(
                    id = "$sport-$i",
                    homeTeam = "Home $i",
                    awayTeam = "Away $i",
                    time = "Today, 7:00 PM (CST)",
                    prediction = if (i % 2 == 0) "Home $i" else "Away $i",
                    confidence = 75 + i,
                    isFree = false
                )
            }
        }
    }
}