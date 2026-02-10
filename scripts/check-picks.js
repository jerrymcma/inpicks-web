// Check what user picks exist and their status
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPicks() {
  const { data: picks, error } = await supabase
    .from('user_picks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Recent picks:')
  picks.forEach(pick => {
    console.log({
      id: pick.id,
      game_id: pick.game_id,
      sport: pick.sport,
      home_team: pick.home_team,
      away_team: pick.away_team,
      game_status: pick.game_status,
      is_correct: pick.is_correct,
      created_at: pick.created_at
    })
  })
}

checkPicks()
