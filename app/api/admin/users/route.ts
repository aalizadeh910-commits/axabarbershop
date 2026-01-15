import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Verify admin token
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, user: null, error: 'Unauthorized' }
  }

  const token = authHeader.slice(7)

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { valid: false, user: null, error: 'Invalid token' }
    }

    return { valid: true, user }
  } catch {
    return { valid: false, user: null, error: 'Token verification failed' }
  }
}

// GET all admin users
export async function GET(request: NextRequest) {
  const { valid, error } = await verifyAdmin(request)

  if (!valid) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    // Return only email and created_at for each user
    const adminUsers = users.users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    }))

    return NextResponse.json(adminUsers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create new admin user
export async function POST(request: NextRequest) {
  const { valid, error: authError } = await verifyAdmin(request)

  if (!valid) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(data.user, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
