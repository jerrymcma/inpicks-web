package com.example.inpicks.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.inpicks.data.AuthRepository
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(
    onDismiss: () -> Unit,
    onAuthSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLogin by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()

    Dialog(onDismissRequest = onDismiss) {
        Card {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(if (isLogin) "Login" else "Sign Up", style = MaterialTheme.typography.headlineSmall)
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    isError = error != null
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    isError = error != null
                )
                error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = {
                        isLoading = true
                        error = null
                        scope.launch {
                            val result = if (isLogin) {
                                AuthRepository.signIn(email, password)
                            } else {
                                AuthRepository.signUp(email, password)
                            }
                            isLoading = false
                            if (result.isSuccess) {
                                onAuthSuccess()
                            } else {
                                error = result.exceptionOrNull()?.message
                            }
                        }
                    },
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp))
                    } else {
                        Text(if (isLogin) "Login" else "Sign Up")
                    }
                }
                TextButton(onClick = { isLogin = !isLogin }) {
                    Text(if (isLogin) "Need an account? Sign up" else "Have an account? Login")
                }
            }
        }
    }
}