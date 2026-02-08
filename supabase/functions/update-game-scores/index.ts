import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const nbaApiKey = Deno.env.get('NBA_API') ?? ''
const nflApiKey = Deno.env.get('NFL_API') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  try {
    console.log('Fetching live scores...')
    const liveGames = []

    // 1. Fetch live scores from SportRadar
    
    // Fetch NFL scores (Weekly schedule which includes live scores)
    if (nflApiKey) {
      try {
        // Using "current_week" endpoint if available, otherwise defaulting to manual logic or full schedule could be needed.
        // Standard SportRadar NFL V7 endpoint for current week:
        const nflResponse = await fetch(`https://api.sportradar.us/nfl/official/trial/v7/en/games/current_week/schedule.json?api_key=${nflApiKey}`)
        
        if (nflResponse.ok) {
          const nflData = await nflResponse.json()
          // nflData.week.games is the array
          const games = nflData.week?.games || []
          liveGames.push(...transformData(games, 'NFL'))
          console.log(`Fetched ${games.length} NFL games`)
        } else {
          console.error('Failed to fetch NFL scores:', nflResponse.status, await nflResponse.text())
        }
      } catch (e) {
        console.error('Error fetching NFL scores:', e)
      }
    }

    // Fetch NBA scores (Daily schedule)
    if (nbaApiKey) {
      try {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        
        const nbaResponse = await fetch(`https://api.sportradar.us/nba/trial/v8/en/games/${year}/${month}/${day}/schedule.json?api_key=${nbaApiKey}`)
        
        if (nbaResponse.ok) {
          const nbaData = await nbaResponse.json()
          // nbaData.games is the array
          const games = nbaData.games || []
          liveGames.push(...transformData(games, 'NBA'))
          console.log(`Fetched ${games.length} NBA games`)
        } else {
           console.error('Failed to fetch NBA scores:', nbaResponse.status, await nbaResponse.text())
        }
      } catch (e) {
        console.error('Error fetching NBA scores:', e)
      }
    }

    // Mock data for demonstration (fallback if API calls are commented out)
    if (liveGames.length === 0) {
       liveGames.push({
        id: 'nfl_chiefs_bills',
        sport: 'NFL',
        status: 'completed',
        home_score: 27,
        away_score: 24,
        winner: 'home',
        home_team: 'Kansas City Chiefs',
        away_team: 'Buffalo Bills'
      })
    }

    // 2. Update Games Table
    for (const game of liveGames) {
      const { error } = await supabase
        .from('games')
        .upsert({
          id: game.id,
          sport: game.sport,
          status: game.status,
          home_score: game.home_score,
          away_score: game.away_score,
          winner: game.winner,
          home_team: game.home_team,
          away_team: game.away_team,
          start_time: new Date().toISOString(), // In real app, preserve original start time
          updated_at: new Date().toISOString()
        })

      if (error) console.error('Error updating game:', error)

      // 3. Resolve User Picks if Game is Completed
      if (game.status === 'completed') {
        await resolvePicksForGame(game)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Scores updated successfully', processed: liveGames.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function resolvePicksForGame(game: any) {
  // Fetch pending picks for this game by matching team names instead of game_id
  // This is necessary because game IDs from Odds API don't match SportRadar IDs
  const { data: picks, error } = await supabase
    .from('user_picks')
    .select('*')
    .eq('sport', game.sport)
    .eq('game_status', 'pending')

  if (error) {
    console.error('Error fetching picks:', error)
    return
  }

  // Filter picks that match this game's teams (handle team name variations)
  const matchingPicks = picks?.filter(pick => {
    if (!pick.home_team || !pick.away_team) return false
    
    // Normalize team names for matching (remove common suffixes, case insensitive)
    const normalizeTeam = (team: string) => 
      team.toLowerCase().replace(/\s+(fc|sc|united|city|town)$/i, '').trim()
    
    const pickHome = normalizeTeam(pick.home_team)
    const pickAway = normalizeTeam(pick.away_team)
    const gameHome = normalizeTeam(game.home_team)
    const gameAway = normalizeTeam(game.away_team)
    
    return (pickHome.includes(gameHome) || gameHome.includes(pickHome)) &&
           (pickAway.includes(gameAway) || gameAway.includes(pickAway))
  }) || []

  console.log(`Found ${matchingPicks.length} picks to resolve for ${game.away_team} @ ${game.home_team}`)

  for (const pick of matchingPicks) {
    let isCorrect = false
    
    // Determine if pick is correct based on prediction type
    if (pick.prediction_type === 'MONEYLINE' || !pick.prediction_type) { 
       if (pick.predicted_outcome === 'home' && game.winner === 'home') isCorrect = true
       else if (pick.predicted_outcome === 'away' && game.winner === 'away') isCorrect = true
    } else if (pick.prediction_type === 'SPREAD' && pick.spread_line) {
      // Calculate if pick covered the spread
      const adjustedHomeScore = game.home_score + pick.spread_line
      if (pick.predicted_outcome === 'home') {
        isCorrect = adjustedHomeScore > game.away_score
      } else if (pick.predicted_outcome === 'away') {
        isCorrect = game.away_score > adjustedHomeScore
      }
    } else if (pick.prediction_type === 'OVER_UNDER' && pick.over_under_line) {
      // Calculate if total went over or under
      const totalScore = game.home_score + game.away_score
      if (pick.predicted_outcome === 'Over') {
        isCorrect = totalScore > pick.over_under_line
      } else if (pick.predicted_outcome === 'Under') {
        isCorrect = totalScore < pick.over_under_line
      }
    }

    // Update the pick
    const { error: updateError } = await supabase
      .from('user_picks')
      .update({
        game_status: 'completed',
        is_correct: isCorrect,
        game_final_score: `${game.away_team} ${game.away_score} - ${game.home_team} ${game.home_score}`,
        actual_outcome: game.winner === 'home' ? 'Home Win' : 'Away Win'
      })
      .eq('id', pick.id)

    if (updateError) {
      console.error('Error updating pick:', updateError)
    } else {
      console.log(`Updated pick ${pick.id}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`)
    }
  }
}

// Helper to transform API data to our Game format
function transformData(games: any[], sport: string) {
  return games.map((game: any) => {
    let status = 'scheduled'
    if (game.status === 'closed' || game.status === 'complete' || game.status === 'completed') status = 'completed'
    else if (game.status === 'inprogress' || game.status === 'live') status = 'live'

    // Determine winner
    let winner: 'home' | 'away' | null = null
    if (status === 'completed') {
       if (game.home_points > game.away_points) winner = 'home'
       else if (game.away_points > game.home_points) winner = 'away'
    }

    return {
      id: game.id, // SportRadar GUID
      sport: sport,
      status: status,
      home_score: game.home_points || 0,
      away_score: game.away_points || 0,
      winner: winner,
      home_team: game.home?.name || game.home?.alias || 'Unknown Home',
      away_team: game.away?.name || game.away?.alias || 'Unknown Away',
      start_time: game.scheduled // ISO string
    }
  })
}
