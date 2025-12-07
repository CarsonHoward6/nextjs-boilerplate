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

async function fixCourses() {
    console.log('Checking current courses in database...\n');

    // Get all current courses
    const { data: existingCourses } = await supabase
        .from('course')
        .select('id, title')
        .order('title');

    console.log('Current courses:');
    existingCourses?.forEach(course => {
        console.log(`  - ${course.title} (${course.id})`);
    });

    // Ensure MATH 101 exists
    const { data: math101 } = await supabase
        .from('course')
        .select('id')
        .eq('title', 'MATH 101')
        .single();

    if (!math101) {
        console.log('\n✨ Creating MATH 101...');
        await supabase.from('course').insert({ title: 'MATH 101' });
    } else {
        console.log('\n✅ MATH 101 already exists');
    }

    // Ensure CSC 102 exists
    const { data: csc102 } = await supabase
        .from('course')
        .select('id')
        .eq('title', 'CSC 102')
        .single();

    if (!csc102) {
        console.log('✨ Creating CSC 102...');
        await supabase.from('course').insert({ title: 'CSC 102' });
    } else {
        console.log('✅ CSC 102 already exists');
    }

    // Show final courses
    const { data: finalCourses } = await supabase
        .from('course')
        .select('id, title')
        .order('title');

    console.log('\n📚 Final courses in database:');
    finalCourses?.forEach(course => {
        console.log(`  - ${course.title}`);
    });

    console.log('\n✅ Done!');
}

fixCourses()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
