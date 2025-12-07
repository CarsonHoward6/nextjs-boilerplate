import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function cleanupCourses() {
    console.log('🧹 Cleaning up extra courses...\n');

    // Courses to keep
    const keepCourses = ['MATH 101', 'CSC 102'];

    // Get all courses
    const { data: allCourses } = await supabase
        .from('course')
        .select('id, title')
        .order('title');

    const coursesToDelete = allCourses?.filter(c => !keepCourses.includes(c.title)) || [];

    if (coursesToDelete.length === 0) {
        console.log('✅ No courses to delete. Database already clean!');
        return;
    }

    console.log('Courses to delete:');
    coursesToDelete.forEach(course => {
        console.log(`  ❌ ${course.title}`);
    });

    console.log('\nCourses to keep:');
    allCourses?.filter(c => keepCourses.includes(c.title)).forEach(course => {
        console.log(`  ✅ ${course.title}`);
    });

    console.log('\n🗑️  Deleting extra courses...');

    for (const course of coursesToDelete) {
        const { error } = await supabase
            .from('course')
            .delete()
            .eq('id', course.id);

        if (error) {
            console.error(`  ⚠️  Error deleting ${course.title}:`, error.message);
        } else {
            console.log(`  ✓ Deleted ${course.title}`);
        }
    }

    // Show final result
    const { data: finalCourses } = await supabase
        .from('course')
        .select('id, title')
        .order('title');

    console.log('\n✅ Final courses in database:');
    finalCourses?.forEach(course => {
        console.log(`  - ${course.title}`);
    });

    console.log('\n🎉 Cleanup complete!');
}

cleanupCourses()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
