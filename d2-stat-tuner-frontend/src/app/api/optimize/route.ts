import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      Health, Melee, Grenade, Super, Class, Weapons, 
      allow_tuned = true,
      use_exotic = false,
      use_class_item_exotic = false,
      exotic_perks,
      minimum_constraints
    } = body

    // Validate input
    const stats = [Health, Melee, Grenade, Super, Class, Weapons]
    if (stats.some(stat => typeof stat !== 'number' || stat < 0)) {
      return NextResponse.json({ error: 'Invalid stat values' }, { status: 400 })
    }
    
    if (typeof allow_tuned !== 'boolean') {
      return NextResponse.json({ error: 'Invalid allow_tuned value' }, { status: 400 })
    }

    if (typeof use_exotic !== 'boolean') {
      return NextResponse.json({ error: 'Invalid use_exotic value' }, { status: 400 })
    }

    if (typeof use_class_item_exotic !== 'boolean') {
      return NextResponse.json({ error: 'Invalid use_class_item_exotic value' }, { status: 400 })
    }

    // Validate exotic perks if using exotic class item
    if (use_exotic && use_class_item_exotic) {
      if (!Array.isArray(exotic_perks) || exotic_perks.length !== 2) {
        return NextResponse.json({ error: 'exotic_perks must be an array of 2 strings when using exotic class item' }, { status: 400 })
      }
    }

    // Call the Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
    
    try {
      const response = await fetch(`${pythonBackendUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          Health, Melee, Grenade, Super, Class, Weapons, 
          allow_tuned, use_exotic, use_class_item_exotic, exotic_perks, minimum_constraints 
        }),
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