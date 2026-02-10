// Check what columns exist in user_picks table
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 Checking user_picks table schema...\n')
  
  // Try to get one pick to see the structure
  const { data: picks, error } = await supabase
    .from('user_picks')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  if (picks && picks.length > 0) {
    console.log('✅ Available columns in user_picks table:')
    console.log(Object.keys(picks[0]))
  } else {
    console.log('⚠️  No picks found, creating a test pick to check schema...')
    
    // Create a minimal test pick
    const { data: testPick, error: insertError } = await supabase
      .from('user_picks')
      .insert({
        user_id: '5ad5d806-b06c-43f5-882c-69c3d3577311',
        game_id: 'schema-test',
        sport: 'NBA',
        prediction_text: 'Test'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
    } else if (testPick) {
      console.log('✅ Available columns:')
      console.log(Object.keys(testPick))
      
      // Clean up
      await supabase.from('user_picks').delete().eq('game_id', 'schema-test')
    }
  }
  
  console.log('\n📋 Required columns for the app to work:')
  const requiredColumns = [
    'id',
    'user_id',
    'game_id',
    'sport',
    'prediction_type',
    'prediction_text',
    'predicted_outcome',
    'actual_outcome',
    'is_correct',
    'game_final_score',
    'spread_line',
    'over_under_line',
    'game_status',
    'home_team',
    'away_team',
    'created_at',
    'updated_at'
  ]
  console.log(requiredColumns)
}

checkSchema()
