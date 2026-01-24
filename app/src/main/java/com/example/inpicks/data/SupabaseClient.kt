package com.example.inpicks.data

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseClient {
    // Supabase credentials loaded from local.properties via BuildConfig
    private const val SUPABASE_URL = com.example.inpicks.BuildConfig.SUPABASE_URL
    private const val SUPABASE_KEY = com.example.inpicks.BuildConfig.SUPABASE_KEY

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest)
        install(Auth)
        install(Functions)
    }
}
