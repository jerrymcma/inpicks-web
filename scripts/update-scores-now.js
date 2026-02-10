// Manual script to trigger game score updates immediately
// Run: node scripts/update-scores-now.js

async function updateScores() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
      process.exit(1)
    }
    
    console.log('Triggering game score update...')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/update-game-scores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge function failed: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('✅ Game scores updated successfully!')
    console.log('Result:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Error updating game scores:', error.message)
    process.exit(1)
  }
}

updateScores()
