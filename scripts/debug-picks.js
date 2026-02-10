// Debug picks and games in the database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('=== DEBUGGING DATABASE ===\n')
  
  // Check all picks
  console.log('📊 Checking user_picks table...')
  const { data: allPicks, error: picksError, count } = await supabase
    .from('user_picks')
    .select('*', { count: 'exact' })
  
  if (picksError) {
    console.error('❌ Error fetching picks:', picksError)
  } else {
    console.log(`✅ Found ${count} total picks in database`)
    if (allPicks && allPicks.length > 0) {
      console.log('\nPick details:')
      allPicks.forEach((pick, index) => {
        console.log(`\n--- Pick #${index + 1} ---`)
        console.log('ID:', pick.id)
        console.log('Sport:', pick.sport)
        console.log('Home Team:', pick.home_team)
        console.log('Away Team:', pick.away_team)
        console.log('Game Status:', pick.game_status)
        console.log('Is Correct:', pick.is_correct)
        console.log('Predicted Outcome:', pick.predicted_outcome)
        console.log('Created:', pick.created_at)
      })
    }
  }
  
  // Check games table
  console.log('\n\n🎮 Checking games table...')
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5)
  
  if (gamesError) {
    console.error('❌ Error fetching games:', gamesError)
  } else {
    console.log(`✅ Found ${games?.length || 0} recent games`)
    if (games && games.length > 0) {
      console.log('\nGame details:')
      games.forEach((game, index) => {
        console.log(`\n--- Game #${index + 1} ---`)
        console.log('ID:', game.id)
        console.log('Sport:', game.sport)
        console.log('Home Team:', game.home_team, '(Score:', game.home_score + ')')
        console.log('Away Team:', game.away_team, '(Score:', game.away_score + ')')
        console.log('Status:', game.status)
        console.log('Winner:', game.winner)
        console.log('Updated:', game.updated_at)
      })
    }
  }
  
  // Check if user is logged in by checking profiles
  console.log('\n\n👤 Checking profiles...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .limit(3)
  
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError)
  } else {
    console.log(`✅ Found ${profiles?.length || 0} user profiles`)
  }
}

debugDatabase()
