import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function debugData() {
    console.log("🔎 Fetching all profiles and roles...");

    const { data: profiles, error: pErr } = await supabase.from('user_profiles').select('*');
    if (pErr) console.error("Profile Error:", pErr);

    const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
    if (rErr) console.error("Role Error:", rErr);

    console.log(`found ${profiles?.length} profiles and ${roles?.length} roles.`);

    if (profiles && roles) {
        profiles.forEach(p => {
            const userRoles = roles.filter(r => r.user_id === p.id);
            const roleNames = userRoles.map(r => r.role);
            console.log(`User: ${p.email} (${p.id})`);
            console.log(`  -> Roles: ${JSON.stringify(roleNames)}`);
            if (roleNames.length === 0) console.log("  -> [WARNING] No roles found for this user.");
        });
    }
}

debugData();
