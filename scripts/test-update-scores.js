// Test the update-game-scores edge function
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpdate() {
  console.log('🔄 Invoking update-game-scores edge function...')
  
  try {
    const { data, error } = await supabase.functions.invoke('update-game-scores', {
      body: {}
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Success! Response:', data)

    // Now check if any picks were updated
    console.log('\n📊 Checking user picks...')
    const { data: picks, error: picksError } = await supabase
      .from('user_picks')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (picksError) {
      console.error('Error fetching picks:', picksError)
      return
    }

    console.log(`Found ${picks.length} picks:`)
    picks.forEach(pick => {
      console.log({
        home: pick.home_team,
        away: pick.away_team,
        status: pick.game_status,
        correct: pick.is_correct,
        outcome: pick.predicted_outcome
      })
    })

  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

testUpdate()
