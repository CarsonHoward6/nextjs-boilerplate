import { getSupabase } from "@/lib/supabase";

export async function getSession() {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session;
}
