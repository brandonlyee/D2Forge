import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { Health, Melee, Grenade, Super, Class, Weapons, allow_tuned = true } = body

    // Validate input
    const stats = [Health, Melee, Grenade, Super, Class, Weapons]
    if (stats.some(stat => typeof stat !== 'number' || stat < 0)) {
      return NextResponse.json({ error: 'Invalid stat values' }, { status: 400 })
    }
    
    if (typeof allow_tuned !== 'boolean') {
      return NextResponse.json({ error: 'Invalid allow_tuned value' }, { status: 400 })
    }

    // Call the Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    try {
      const response = await fetch(`${pythonBackendUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Health, Melee, Grenade, Super, Class, Weapons, allow_tuned }),
      })

      if (!response.ok) {
        throw new Error(`Python backend responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Failed to connect to Python backend:', fetchError)
      return NextResponse.json(
        { error: 'Python backend is not available. Please ensure the backend server is running.' }, 
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error in optimize API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}