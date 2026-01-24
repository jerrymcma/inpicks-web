package com.example.inpicks.data

import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import io.github.jan.supabase.gotrue.providers.builtin.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

object AuthRepository {
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _currentUser = MutableStateFlow(SupabaseClient.client.auth.currentUserOrNull())
    val currentUser = _currentUser.asStateFlow()

    init {
        // Listen for auth state changes from Supabase
        applicationScope.launch {
            SupabaseClient.client.auth.sessionStatus.collect { status ->
                _currentUser.value = when (status) {
                    is SessionStatus.Authenticated -> status.session.user
                    is SessionStatus.NotAuthenticated -> null
                    is SessionStatus.NetworkError -> null
                    else -> _currentUser.value // Handle any other states, including loading and loading from storage
                }
            }
        }
    }

    suspend fun signUp(email: String, password: String): Result<Unit> {
        return try {
            SupabaseClient.client.auth.signUpWith(Email) {
                this.email = email
                this.password = password
            }
            // _currentUser will be updated by the sessionStatus collector
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signIn(email: String, password: String): Result<Unit> {
        return try {
            SupabaseClient.client.auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            // _currentUser will be updated by the sessionStatus collector
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signOut() {
        try {
            SupabaseClient.client.auth.signOut()
            // _currentUser will be updated by the sessionStatus collector
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun isUserLoggedIn(): Boolean {
        return _currentUser.value != null
    }

    fun getUserId(): String? {
        return _currentUser.value?.id
    }
}
