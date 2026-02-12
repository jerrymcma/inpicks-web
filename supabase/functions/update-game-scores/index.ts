import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const nbaApiKey = Deno.env.get('NBA_API') ?? ''
const mlbApiKey = Deno.env.get('MLB_API') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  try {
    console.log('Fetching live scores...')
    const liveGames = []

    // 1. Fetch live scores from SportRadar
    
    // Fetch MLB scores (Daily schedule which includes live scores)
    if (mlbApiKey) {
      try {
        const dateOffsets = [0, -1]
        for (const offset of dateOffsets) {
          const date = new Date()
          date.setDate(date.getDate() + offset)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')

          const mlbResponse = await fetch(`https://api.sportradar.us/mlb/trial/v7/en/games/${year}/${month}/${day}/schedule.json?api_key=${mlbApiKey}`)

          if (mlbResponse.ok) {
            const mlbData = await mlbResponse.json()
            const games = mlbData.games || []
            liveGames.push(...transformData(games, 'MLB'))
            console.log(`Fetched ${games.length} MLB games for ${year}-${month}-${day}`)
          } else {
            console.error('Failed to fetch MLB scores:', mlbResponse.status, await mlbResponse.text())
          }
        }
      } catch (e) {
        console.error('Error fetching MLB scores:', e)
      }
    }

    // Fetch NBA scores (Daily schedule)
    if (nbaApiKey) {
      try {
        const dateOffsets = [0, -1]
        for (const offset of dateOffsets) {
          const date = new Date()
          date.setDate(date.getDate() + offset)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')

          const nbaResponse = await fetch(`https://api.sportradar.us/nba/trial/v8/en/games/${year}/${month}/${day}/schedule.json?api_key=${nbaApiKey}`)

          if (nbaResponse.ok) {
            const nbaData = await nbaResponse.json()
            const games = nbaData.games || []
            liveGames.push(...transformData(games, 'NBA'))
            console.log(`Fetched ${games.length} NBA games for ${year}-${month}-${day}`)
          } else {
            console.error('Failed to fetch NBA scores:', nbaResponse.status, await nbaResponse.text())
          }
        }
      } catch (e) {
        console.error('Error fetching NBA scores:', e)
      }
    }

    // Mock data for demonstration (fallback if API calls are commented out)
    if (liveGames.length === 0) {
       liveGames.push({
        id: 'mlb_yankees_redsox',
        sport: 'MLB',
        status: 'completed',
        home_score: 5,
        away_score: 3,
        winner: 'home',
        home_team: 'New York Yankees',
        away_team: 'Boston Red Sox'
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
      } else if (game.status === 'live') {
        await updatePicksStatusForGame(game, 'in_progress')
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
    .or('game_status.eq.pending,game_status.eq.in_progress,game_status.is.null')

  if (error) {
    console.error('Error fetching picks:', error)
    return
  }

  const matchingPicks = getMatchingPicks(picks, game)

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

async function updatePicksStatusForGame(game: any, status: 'in_progress') {
  const { data: picks, error } = await supabase
    .from('user_picks')
    .select('*')
    .eq('sport', game.sport)
    .or('game_status.eq.pending,game_status.is.null')

  if (error) {
    console.error('Error fetching picks:', error)
    return
  }

  const matchingPicks = getMatchingPicks(picks, game)

  for (const pick of matchingPicks) {
    const { error: updateError } = await supabase
      .from('user_picks')
      .update({ game_status: status })
      .eq('id', pick.id)

    if (updateError) {
      console.error('Error updating pick status:', updateError)
    }
  }
}

function getMatchingPicks(picks: any[] | null, game: any) {
  return (
    picks?.filter(pick => {
      if (!pick.home_team || !pick.away_team) return false

      const normalizeTeam = (team: string) =>
        team.toLowerCase().replace(/\s+(fc|sc|united|city|town)$/i, '').trim()

      const pickHome = normalizeTeam(pick.home_team)
      const pickAway = normalizeTeam(pick.away_team)
      const gameHome = normalizeTeam(game.home_team)
      const gameAway = normalizeTeam(game.away_team)

      return (pickHome.includes(gameHome) || gameHome.includes(pickHome)) &&
        (pickAway.includes(gameAway) || gameAway.includes(pickAway))
    }) || []
  )
}

// Helper to transform API data to our Game format
function transformData(games: any[], sport: string) {
  return games.map((game: any) => {
    let status = 'scheduled'
    if (game.status === 'closed' || game.status === 'complete' || game.status === 'completed') status = 'completed'
    else if (game.status === 'inprogress' || game.status === 'live') status = 'live'

    // Get score based on sport (MLB uses 'runs', NBA/NFL use 'points')
    const homeScore = sport === 'MLB' ? (game.home?.runs || game.home_runs || 0) : (game.home_points || game.home?.points || 0)
    const awayScore = sport === 'MLB' ? (game.away?.runs || game.away_runs || 0) : (game.away_points || game.away?.points || 0)

    // Determine winner
    let winner: 'home' | 'away' | null = null
    if (status === 'completed') {
       if (homeScore > awayScore) winner = 'home'
       else if (awayScore > homeScore) winner = 'away'
    }

    return {
      id: game.id, // SportRadar GUID
      sport: sport,
      status: status,
      home_score: homeScore,
      away_score: awayScore,
      winner: winner,
      home_team: game.home?.name || game.home?.market || game.home?.alias || 'Unknown Home',
      away_team: game.away?.name || game.away?.market || game.away?.alias || 'Unknown Away',
      start_time: game.scheduled // ISO string
    }
  })
}
