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
}
