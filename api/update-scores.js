// Vercel Cron Job - Calls Supabase Edge Function to update game scores
// Runs every 5 minutes: */5 * * * *

module.exports = async (req, res) => {
  try {
    // Verify the request is from Vercel Cron
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    console.log('Cron job triggered: Updating game scores...')
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials')
    }
    
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
    console.log('Game scores updated successfully:', data)
    
    return res.status(200).json({
      success: true,
      message: 'Game scores updated',
      data
    })
  } catch (error) {
    console.error('Error updating game scores:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
