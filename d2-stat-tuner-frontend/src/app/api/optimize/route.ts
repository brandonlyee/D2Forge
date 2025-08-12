import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { Health, Melee, Grenade, Super, Class, Weapons } = body

    // Validate input
    const stats = [Health, Melee, Grenade, Super, Class, Weapons]
    if (stats.some(stat => typeof stat !== 'number' || stat < 0)) {
      return NextResponse.json({ error: 'Invalid stat values' }, { status: 400 })
    }

    // Call the Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    try {
      const response = await fetch(`${pythonBackendUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Health, Melee, Grenade, Super, Class, Weapons }),
      })

      if (!response.ok) {
        throw new Error(`Python backend responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Failed to connect to Python backend:', fetchError)
      
      // Fallback to mock data if Python backend is not available
      console.log('Falling back to mock data...')
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time

      const mockResponse = {
        solutions: [
          {
            pieces: {
              '{"arch": "Bulwark", "tertiary": "Grenade", "mod_target": "Health", "tuned_stat": null, "siphon_from": null}': 2,
              '{"arch": "Paragon", "tertiary": "Health", "mod_target": "Super", "tuned_stat": null, "siphon_from": null}': 3,
            },
            deviation: 0,
            actualStats: [Health, Melee, Grenade, Super, Class, Weapons]
          }
        ],
        message: "Mock solution (Python backend not available)"
      }

      return NextResponse.json(mockResponse)
    }
  } catch (error) {
    console.error('Error in optimize API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}