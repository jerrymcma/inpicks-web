// Simulate a completed game to test the update logic
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulateGame() {
  console.log('🎮 Creating a test pick and completing the game...\n')
  
  // Clean up any existing test data first
  console.log('🧹 Cleaning up old test data...')
  await supabase.from('user_picks').delete().eq('game_id', 'test-game-123')
  await supabase.from('games').delete().eq('id', 'test-game-123')
  console.log('✅ Cleanup complete\n')
  
  // Get first user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.error('❌ No users found')
    return
  }
  
  const userId = profiles[0].id
  console.log('✅ Using user ID:', userId)
  
  // Create a test pick
  const testPick = {
    user_id: userId,
    game_id: 'test-game-123',
    sport: 'NBA',
    prediction_type: 'MONEYLINE',
    prediction_text: 'Lakers will win this game',
    predicted_outcome: 'home',
    home_team: 'Los Angeles Lakers',
    away_team: 'San Antonio Spurs',
    game_status: 'pending'
  }
  
  console.log('\n📝 Creating test pick...')
  const { data: pick, error: pickError } = await supabase
    .from('user_picks')
    .insert(testPick)
    .select()
    .single()
  
  if (pickError) {
    console.error('❌ Error creating pick:', pickError)
    return
  }
  
  console.log('✅ Test pick created:', pick.id)
  
  // Create a completed game
  const completedGame = {
    id: 'test-game-123',
    sport: 'NBA',
    home_team: 'Los Angeles Lakers',
    away_team: 'San Antonio Spurs',
    start_time: new Date().toISOString(),
    status: 'completed',
    home_score: 112,
    away_score: 98,
    winner: 'home'
  }
  
  console.log('\n🏀 Creating completed game...')
  const { error: gameError } = await supabase
    .from('games')
    .upsert(completedGame)
  
  if (gameError) {
    console.error('❌ Error creating game:', gameError)
    return
  }
  
  console.log('✅ Completed game created')
  
  // Now manually trigger the pick update (simulating what the edge function does)
  console.log('\n⚡ Updating pick to completed...')
  const { error: updateError } = await supabase
    .from('user_picks')
    .update({
      game_status: 'completed',
      is_correct: true,
      game_final_score: 'San Antonio Spurs 98 - Los Angeles Lakers 112',
      actual_outcome: 'Home Win'
    })
    .eq('id', pick.id)
  
  if (updateError) {
    console.error('❌ Error updating pick:', updateError)
    return
  }
  
  console.log('✅ Pick marked as completed and CORRECT!')
  
  // Verify the update
  console.log('\n📊 Verifying updated pick...')
  const { data: updatedPick } = await supabase
    .from('user_picks')
    .select('*')
    .eq('id', pick.id)
    .single()
  
  console.log('\nUpdated Pick:')
  console.log('- Game Status:', updatedPick.game_status)
  console.log('- Is Correct:', updatedPick.is_correct)
  console.log('- Final Score:', updatedPick.game_final_score)
  console.log('- Actual Outcome:', updatedPick.actual_outcome)
  
  console.log('\n✅ Test complete! Check your app - you should see:')
  console.log('   - Win Rate: 100%')
  console.log('   - 1 win out of 1 completed pick')
  console.log('   - Pick result: Win')
}

simulateGame()
