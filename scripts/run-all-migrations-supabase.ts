import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runAllMigrations() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const migrationsDir = path.join(process.cwd(), 'lib/migrations');
    const migrationFiles = [
        '001_create_course_tables.sql',
        '002_create_user_roles.sql',
        '003_create_announcements.sql',
        '004_create_notifications.sql',
        '005_enable_rls_policies.sql',
        '006_fix_function_search_path.sql',
        '007_add_username_field.sql',
        '008_update_notifications.sql',
        '009_create_assignment_submissions.sql',
        '010_enhance_pages_and_blocks.sql',
        '011_update_submissions_schema.sql',
        '012_add_first_login_tracking.sql',
        '013_create_user_courses.sql',
        '014_admin_user_notifications.sql'
    ];

    console.log('🚀 Running migrations on Supabase...\n');

    for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping ${file} - file not found`);
            continue;
        }

        try {
            console.log(`📝 Running ${file}...`);
            const sql = fs.readFileSync(filePath, 'utf8');

            const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

            if (error) {
                console.error(`❌ Error in ${file}:`, error.message);
                // Continue with other migrations
            } else {
                console.log(`✅ ${file} completed`);
            }
        } catch (error) {
            console.error(`❌ Failed to run ${file}:`, error);
        }
    }

    console.log('\n✅ All migrations completed!');
}

runAllMigrations();
