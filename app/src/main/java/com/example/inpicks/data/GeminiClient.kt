package com.example.inpicks.data

import com.google.ai.client.generativeai.GenerativeModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object GeminiClient {
    // API Key loaded from local.properties via BuildConfig
    private const val API_KEY = com.example.inpicks.BuildConfig.GEMINI_API_KEY

    private val generativeModel = GenerativeModel(
        modelName = "gemini-2.0-flash-001",
        apiKey = API_KEY
    )

    suspend fun analyzeMatchup(sport: String, homeTeam: String, awayTeam: String): String {
        return withContext(Dispatchers.IO) {
            val prompt = """
                You are a professional sports analyst with an 80% win rate.
                Analyze this $sport matchup: $awayTeam (Away) vs $homeTeam (Home).
                
                Provide a structured prediction in this exact format:
                Winner: [Team Name]
                Confidence: [Number]%
                Key Factor: [One short sentence explaining the decisive factor]
                
                Base your analysis on team stats, recent performance, and injuries if known.
            """.trimIndent()

            try {
                val response = generativeModel.generateContent(prompt)
                response.text ?: "Analysis unavailable."
            } catch (e: Exception) {
                e.printStackTrace()
                "Error generating prediction: ${e.localizedMessage}"
            }
        }
    }

    suspend fun analyzeSpread(sport: String, homeTeam: String, awayTeam: String, homeSpread: Double, awaySpread: Double): String {
        return withContext(Dispatchers.IO) {
            val favorite = if (homeSpread < 0) homeTeam else awayTeam
            val underdog = if (homeSpread < 0) awayTeam else homeTeam
            val spreadValue = kotlin.math.abs(homeSpread)
            
            val prompt = """
                You are a professional sports betting analyst specializing in point spreads with an 82% accuracy rate.
                Analyze this $sport spread bet: $awayTeam (Away) vs $homeTeam (Home).
                
                SPREAD: $homeTeam ${if(homeSpread > 0) "+" else ""}$homeSpread, $awayTeam ${if(awaySpread > 0) "+" else ""}$awaySpread
                
                The favorite is $favorite giving $spreadValue points to $underdog.
                
                Provide your analysis in this exact format:
                Pick: [Team] ${if(homeSpread < 0) homeSpread else awaySpread}
                Confidence: [Number]%
                Reasoning: [2-3 sentences explaining why this team will cover the spread]
                
                Focus on: offensive/defensive efficiency, recent form, head-to-head history, and motivation factors.
            """.trimIndent()

            try {
                val response = generativeModel.generateContent(prompt)
                response.text ?: "Spread analysis unavailable."
            } catch (e: Exception) {
                e.printStackTrace()
                "Error generating spread prediction: ${e.localizedMessage}"
            }
        }
    }

    suspend fun analyzeOverUnder(sport: String, homeTeam: String, awayTeam: String, total: Double): String {
        return withContext(Dispatchers.IO) {
            val prompt = """
                You are a professional sports betting analyst specializing in totals with an 79% accuracy rate.
                Analyze this $sport over/under bet: $awayTeam (Away) vs $homeTeam (Home).
                
                TOTAL: Over/Under $total points
                
                Provide your analysis in this exact format:
                Pick: [Over/Under] $total
                Confidence: [Number]%
                Reasoning: [2-3 sentences explaining your total prediction]
                
                Consider: pace of play, offensive/defensive rankings, weather (if applicable), recent scoring trends, and head-to-head scoring history.
            """.trimIndent()

            try {
                val response = generativeModel.generateContent(prompt)
                response.text ?: "Total analysis unavailable."
            } catch (e: Exception) {
                e.printStackTrace()
                "Error generating over/under prediction: ${e.localizedMessage}"
            }
        }
    }
}
