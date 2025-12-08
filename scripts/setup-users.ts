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

async function setupUsers() {
    console.log('🚀 Setting up users...\n');

    // All available courses
    const { data: allCourses } = await supabase
        .from('course')
        .select('id, title')
        .order('title');

    if (!allCourses || allCourses.length === 0) {
        console.error('❌ No courses found in database. Run seed-all-courses.ts first.');
        process.exit(1);
    }

    console.log(`📚 Found ${allCourses.length} courses in database\n`);

    // === SETUP ADMIN USER ===
    console.log('👤 Setting up admin user: carsonhoward6@gmail.com');

    const { data: adminAuthUser } = await supabase.auth.admin.listUsers();
    const adminUser = adminAuthUser?.users.find(u => u.email === 'carsonhoward6@gmail.com');

    if (!adminUser) {
        console.error('❌ Admin user carsonhoward6@gmail.com not found in auth.users');
        console.error('   Please create this user account first');
    } else {
        console.log(`   ✓ Found user (ID: ${adminUser.id})`);

        // Ensure profile exists
        const { data: adminProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', adminUser.id)
            .single();

        if (!adminProfile) {
            console.log('   Creating user profile...');
            await supabase
                .from('user_profiles')
                .insert({ id: adminUser.id, email: adminUser.email });
        }

        // Check if already has admin role
        const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', adminUser.id)
            .eq('role', 'admin')
            .single();

        if (existingRole) {
            console.log('   ✓ Already has admin role');
        } else {
            console.log('   Adding admin role...');
            const { error } = await supabase
                .from('user_roles')
                .insert({ user_id: adminUser.id, role: 'admin' });

            if (error) {
                console.error('   ❌ Error adding admin role:', error.message);
            } else {
                console.log('   ✓ Admin role added successfully');
            }
        }
    }

    console.log('');

    // === SETUP STUDENT USER ===
    console.log('👤 Setting up student user: carson.howard@svu.edu');

    const studentUser = adminAuthUser?.users.find(u => u.email === 'carson.howard@svu.edu');

    if (!studentUser) {
        console.error('❌ Student user carson.howard@svu.edu not found in auth.users');
        console.error('   Please create this user account first');
        console.log('\n✅ Setup completed (partial)');
        return;
    }

    console.log(`   ✓ Found user (ID: ${studentUser.id})`);

    // Ensure profile exists
    const { data: studentProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', studentUser.id)
        .single();

    if (!studentProfile) {
        console.log('   Creating user profile...');
        await supabase
            .from('user_profiles')
            .insert({ id: studentUser.id, email: studentUser.email });
    }

    // Randomly select 6 courses
    const shuffled = [...allCourses].sort(() => Math.random() - 0.5);
    const selectedCourses = shuffled.slice(0, 6);

    console.log(`\n   📝 Assigning 6 random courses as student:`);

    for (const course of selectedCourses) {
        // Check if already assigned
        const { data: existing } = await supabase
            .from('user_courses')
            .select('id')
            .eq('user_id', studentUser.id)
            .eq('course_id', course.id)
            .eq('role', 'student')
            .single();

        if (existing) {
            console.log(`      ✓ ${course.title} (already assigned)`);
        } else {
            const { error } = await supabase
                .from('user_courses')
                .insert({
                    user_id: studentUser.id,
                    course_id: course.id,
                    role: 'student'
                });

            if (error) {
                console.error(`      ❌ ${course.title} - Error:`, error.message);
            } else {
                console.log(`      ✓ ${course.title} (assigned)`);
            }
        }
    }

    console.log('\n✅ Setup completed successfully!');
    console.log('\nSummary:');
    console.log('  • carsonhoward6@gmail.com: admin role');
    console.log('  • carson.howard@svu.edu: student in 6 courses');
}

setupUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
