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

const coursesWithPages = [
    { id: 1, title: "Biology", pages: ["Cells", "Genetics", "Evolution", "Ecology", "Human Anatomy"] },
    { id: 2, title: "Algebra", pages: ["Linear Equations", "Quadratics", "Polynomials", "Inequalities", "Functions"] },
    { id: 3, title: "Chemistry", pages: ["Atomic Structure", "Chemical Bonding", "Periodic Table", "Reactions", "Organic Chemistry"] },
    { id: 4, title: "Physics", pages: ["Mechanics", "Thermodynamics", "Waves & Optics", "Electricity", "Magnetism"] },
    { id: 5, title: "History", pages: ["Ancient Civilizations", "Medieval Period", "Renaissance", "Modern History", "World Wars"] },
    { id: 6, title: "Computer Science", pages: ["Programming Basics", "Data Structures", "Algorithms", "Web Development", "Databases"] }
];

async function seedSections() {
    console.log('Starting to seed course sections...');

    // First, create or get courses in the database
    console.log('Creating courses...');
    const courseMap = new Map<number, string>(); // Maps our integer IDs to database UUIDs

    for (const course of coursesWithPages) {
        // Check if course already exists
        const { data: existing } = await supabase
            .from('course')
            .select('id, title')
            .eq('title', course.title)
            .single();

        if (existing) {
            console.log(`  Course "${course.title}" already exists`);
            courseMap.set(course.id, existing.id);
        } else {
            // Create new course
            const { data: newCourse, error } = await supabase
                .from('course')
                .insert({ title: course.title })
                .select()
                .single();

            if (error) {
                console.error(`Error creating course "${course.title}":`, error);
                process.exit(1);
            }

            console.log(`  Created course "${course.title}"`);
            courseMap.set(course.id, newCourse.id);
        }
    }

    // Check if we have any existing sections
    const { data: existing } = await supabase
        .from('section')
        .select('id');

    if (existing && existing.length > 0) {
        console.log(`\nFound ${existing.length} existing sections. Skipping section creation.`);
        console.log('If you want to reseed, delete existing sections first.');
        return;
    }

    // Now create sections with proper course UUIDs
    const sections = [];

    for (const course of coursesWithPages) {
        const courseUuid = courseMap.get(course.id);
        if (!courseUuid) {
            console.error(`No UUID found for course ${course.id}`);
            continue;
        }

        for (const page of course.pages) {
            sections.push({
                title: page,
                course_id: courseUuid,
                year: new Date().getFullYear(),
                semester: 'Current'
            });
        }
    }

    console.log(`\nInserting ${sections.length} sections...`);

    const { data, error } = await supabase
        .from('section')
        .insert(sections)
        .select();

    if (error) {
        console.error('Error seeding sections:', error);
        process.exit(1);
    }

    console.log(`Successfully seeded ${data?.length} sections!`);
    console.log('\nSections created:');
    coursesWithPages.forEach(course => {
        console.log(`\n${course.title}:`);
        course.pages.forEach(page => {
            console.log(`  - ${page}`);
        });
    });
}

seedSections()
    .then(() => {
        console.log('\nSeed completed!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });