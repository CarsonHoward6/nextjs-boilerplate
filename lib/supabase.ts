// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
    if (!supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!url || !key) {
            throw new Error('Missing Supabase environment variables')
        }

        supabase = createClient(url, key)
    }
    return supabase
}
