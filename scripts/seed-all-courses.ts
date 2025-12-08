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

// All courses from the courses dropdown
const allCourses = [
    'MATH 101',
    'CSC 102',
    'CHEM 103',
    'PHYS 104',
    'ENG 105',
    'BIO 106',
    'HIST 107',
    'ECON 108',
    'PSY 109',
    'ART 110',
    'MUS 111',
    'SPAN 112',
    'SOC 113',
    'PHIL 114',
    'STAT 115',
    'GEO 116',
    'BUS 117',
    'ENV 118',
    'NURS 119'
];

async function seedAllCourses() {
    console.log('🎓 Adding all courses to database...\n');

    let addedCount = 0;
    let existingCount = 0;

    for (const courseTitle of allCourses) {
        // Check if course already exists
        const { data: existing } = await supabase
            .from('course')
            .select('id')
            .eq('title', courseTitle)
            .single();

        if (existing) {
            console.log(`  ✓ ${courseTitle} (already exists)`);
            existingCount++;
        } else {
            // Create new course
            const { error } = await supabase
                .from('course')
                .insert({ title: courseTitle });

            if (error) {
                console.error(`  ✗ Error creating ${courseTitle}:`, error.message);
            } else {
                console.log(`  ✓ ${courseTitle} (created)`);
                addedCount++;
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  - Total courses: ${allCourses.length}`);
    console.log(`  - Already existed: ${existingCount}`);
    console.log(`  - Newly added: ${addedCount}`);

    // Show all courses in database
    const { data: finalCourses } = await supabase
        .from('course')
        .select('id, title')
        .order('title');

    console.log(`\n✅ All courses in database (${finalCourses?.length}):`);
    finalCourses?.forEach(course => {
        console.log(`  - ${course.title}`);
    });

    console.log('\n🎉 Done! You can now assign these courses in the admin panel.');
}

seedAllCourses()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
