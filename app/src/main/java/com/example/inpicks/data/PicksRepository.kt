package com.example.inpicks.data

import com.example.inpicks.model.Game
import com.example.inpicks.model.Profile
import com.example.inpicks.model.UserPick
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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

            _unlockedGames.value = unlocked.map { it.gameId }.toSet()
            _predictions.value = unlocked.associate { it.gameId to it.predictionText }

        } catch (e: Exception) {
            e.printStackTrace()
        }
        return userProfile
    }

    suspend fun generatePrediction(gameId: String, sport: String, homeTeam: String, awayTeam: String): String {
        // Check if already generated
        _predictions.value[gameId]?.let { return it }
        
        // Generate new prediction with Gemini
        return try {
            val analysis = GeminiClient.analyzeMatchup(sport, homeTeam, awayTeam)
            analysis
        } catch (e: Exception) {
            e.printStackTrace()
            "Unable to generate prediction. Please try again."
        }
    }

    suspend fun lockInGame(gameId: String, sport: String, predictionText: String): Boolean {
        val userId = AuthRepository.getUserId()
        if (userId == null) return false

        // Check if already locked in
        if (_unlockedGames.value.contains(gameId)) {
            return true
        }

        if (_isSubscribed.value || _freePicksRemaining.value > 0) {
            try {
                val newPick = UserPick(
                    userId = userId,
                    gameId = gameId,
                    sport = sport,
                    predictionText = predictionText
                )
                SupabaseClient.client.from("user_picks").insert(newPick)
                
                if (!_isSubscribed.value) {
                    val newCount = _freePicksRemaining.value - 1
                    println("DEBUG: Updating free picks from ${_freePicksRemaining.value} to $newCount for user $userId")
                    try {
                        SupabaseClient.client.from("profiles").update(
                            { set("free_picks_remaining", newCount) }
                        ) {
                            filter { eq("id", userId) }
                        }
                        println("DEBUG: Successfully updated Supabase profile")
                    } catch (updateError: Exception) {
                        println("DEBUG: Failed to update Supabase profile: ${updateError.message}")
                        updateError.printStackTrace()
                        throw updateError // Re-throw to fail the whole operation
                    }
                    // Optimistically update local state for immediate UI feedback.
                    _freePicksRemaining.value = newCount
                    println("DEBUG: Local state updated to $newCount")
                }

                _unlockedGames.value += gameId
                _predictions.value += (gameId to predictionText)
                return true
            } catch (e: Exception) {
                e.printStackTrace()
                return false
            }
        }
        return false
    }

    suspend fun lockInGame(gameId: String, sport: String, predictionText: String, profile: Profile): Boolean {
        val userId = profile.id

        // Check if already locked in
        if (_unlockedGames.value.contains(gameId)) {
            return true
        }

        if (profile.isSubscribed || profile.freePicksRemaining > 0) {
            try {
                val newPick = UserPick(
                    userId = userId,
                    gameId = gameId,
                    sport = sport,
                    predictionText = predictionText
                )
                SupabaseClient.client.from("user_picks").insert(newPick)

                if (!profile.isSubscribed) {
                    val newCount = profile.freePicksRemaining - 1
                    println("DEBUG: Updating free picks from ${profile.freePicksRemaining} to $newCount for user $userId")
                    try {
                        SupabaseClient.client.from("profiles").update(
                            { set("free_picks_remaining", newCount) }
                        ) {
                            filter { eq("id", userId) }
                        }
                        println("DEBUG: Successfully updated Supabase profile")
                    } catch (updateError: Exception) {
                        println("DEBUG: Failed to update Supabase profile: ${updateError.message}")
                        updateError.printStackTrace()
                        throw updateError // Re-throw to fail the whole operation
                    }
                    // Optimistically update local state for immediate UI feedback.
                    _freePicksRemaining.value = newCount
                    println("DEBUG: Local state updated to $newCount")
                }

                _unlockedGames.value += gameId
                _predictions.value += (gameId to predictionText)
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

    suspend fun getGames(sport: String): List<Game> {
        return try {
            // Fetch live schedule from The-Odds-API
            val upcomingGames = SportsDataClient.getUpcomingGames(sport)
            
            // Convert to Game objects
            upcomingGames.map { sportsGame ->
                Game(
                    id = sportsGame.id,
                    homeTeam = sportsGame.homeTeam,
                    awayTeam = sportsGame.awayTeam,
                    time = formatGameTime(sportsGame.commenceTime),
                    prediction = "Tap to Analyze", 
                    confidence = 0,
                    isFree = false
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