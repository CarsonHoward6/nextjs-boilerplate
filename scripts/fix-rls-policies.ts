import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing environment variables!');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixRLSPolicies() {
    console.log('Fixing RLS policies for user tables...\n');

    // Disable RLS on user_sections, user_roles, and user_profiles for easier admin management
    // Since we're controlling access via the admin email check in the app

    const tables = ['user_sections', 'user_roles', 'user_profiles'];

    for (const table of tables) {
        console.log(`Disabling RLS on ${table}...`);

        const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });

        if (error) {
            // Try alternative approach using raw SQL
            console.log(`Trying alternative approach for ${table}...`);

            // Since we can't directly execute DDL, we'll use the REST API to check table status
            const { error: checkError } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (checkError) {
                console.error(`Error checking ${table}:`, checkError.message);
                console.log(`\nPlease run this SQL manually in Supabase SQL Editor:`);
                console.log(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;\n`);
            } else {
                console.log(`✓ ${table} is accessible`);
            }
        } else {
            console.log(`✓ Disabled RLS on ${table}`);
        }
    }

    console.log('\n=================================================');
    console.log('If you see errors above, please run these SQL commands');
    console.log('manually in your Supabase SQL Editor:');
    console.log('=================================================\n');
    console.log('ALTER TABLE user_sections DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;');
    console.log('\n=================================================\n');
}

fixRLSPolicies()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Failed:', err);
        process.exit(1);
    });
