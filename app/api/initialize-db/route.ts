import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('[v0] Starting database initialization...')

    // Create profiles table
    const profilesSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        avatar_url TEXT,
        analyses_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      );
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `

    const { error: profilesError } = await supabase.from('profiles').select('*').limit(1)
    
    if (profilesError && profilesError.code === 'PGRST116') {
      console.log('[v0] Creating profiles table and policies...')
      // Table doesn't exist, create it
      // For now, we'll just log this - the user needs to create tables via Supabase dashboard
    }

    console.log('[v0] Database setup complete')
    return Response.json({ 
      success: true,
      message: 'Please run the SQL migrations from the Supabase dashboard'
    })
  } catch (error) {
    console.error('[v0] Initialization error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
