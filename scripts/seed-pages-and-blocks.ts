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

// Mock data from app/lms/page.tsx
const mockCourses = [
    {
        title: "MATH 101",
        pages: [
            { title: "Assignment 1: Linear Equations", blocks: [
                { title: "Problem 1", content: "Solve for x: 2x + 5 = 13. Show all your work." },
                { title: "Problem 2", content: "Graph the equation y = 3x - 2 and identify the slope and y-intercept." }
            ]},
            { title: "Assignment 2: Quadratic Functions", blocks: [
                { title: "Problem 1", content: "Factor the quadratic expression: x² + 7x + 12" },
                { title: "Problem 2", content: "Use the quadratic formula to solve: 2x² - 5x - 3 = 0" }
            ]},
            { title: "Assignment 3: Systems of Equations", blocks: [
                { title: "Problem 1", content: "Solve the system: 2x + y = 10 and x - y = 2" },
                { title: "Problem 2", content: "Use substitution method to solve: y = 2x + 1 and 3x + y = 9" }
            ]},
            { title: "Assignment 4: Polynomials", blocks: [
                { title: "Problem 1", content: "Multiply and simplify: (x + 3)(x - 5)" },
                { title: "Problem 2", content: "Factor completely: 2x³ + 8x² + 8x" }
            ]},
            { title: "Assignment 5: Rational Expressions", blocks: [
                { title: "Problem 1", content: "Simplify: (x² - 4)/(x - 2)" },
                { title: "Problem 2", content: "Add and simplify: 1/x + 2/(x+1)" }
            ]},
        ]
    },
    {
        title: "CSC 102",
        pages: [
            { title: "Assignment 1: Python Basics", blocks: [
                { title: "Problem 1", content: "Write a Python function that takes a list of numbers and returns the sum of all even numbers." },
                { title: "Problem 2", content: "Create a program that prints the Fibonacci sequence up to n terms." }
            ]},
            { title: "Assignment 2: Data Structures", blocks: [
                { title: "Problem 1", content: "Implement a stack using a Python list with push, pop, and peek operations." },
                { title: "Problem 2", content: "Write a function to reverse a linked list." }
            ]},
            { title: "Assignment 3: Loops and Conditionals", blocks: [
                { title: "Problem 1", content: "Write a program that prints all prime numbers up to 100." },
                { title: "Problem 2", content: "Create a function that checks if a string is a palindrome." }
            ]},
            { title: "Assignment 4: Functions and Recursion", blocks: [
                { title: "Problem 1", content: "Write a recursive function to calculate factorial of n." },
                { title: "Problem 2", content: "Implement binary search using recursion." }
            ]},
            { title: "Assignment 5: File I/O", blocks: [
                { title: "Problem 1", content: "Write a program to read a file and count the number of words." },
                { title: "Problem 2", content: "Create a function to write data to a CSV file." }
            ]},
        ]
    },
];

async function seedPagesAndBlocks() {
    console.log('Starting to seed pages and blocks...\n');

    // Check if pages already exist
    const { data: existingPages } = await supabase
        .from('page')
        .select('id')
        .limit(1);

    if (existingPages && existingPages.length > 0) {
        console.log('⚠️  Pages already exist in database.');
        console.log('Delete existing pages first if you want to reseed.\n');
        console.log('Seed completed (skipped).');
        return;
    }

    let totalPages = 0;
    let totalBlocks = 0;

    for (const mockCourse of mockCourses) {
        console.log(`Processing course: ${mockCourse.title}`);

        // Find or create course
        let { data: course } = await supabase
            .from('course')
            .select('id')
            .eq('title', mockCourse.title)
            .single();

        if (!course) {
            console.log(`  Creating new course: ${mockCourse.title}`);
            const { data: newCourse, error } = await supabase
                .from('course')
                .insert({ title: mockCourse.title })
                .select('id')
                .single();

            if (error) {
                console.error(`  Error creating course:`, error);
                continue;
            }
            course = newCourse;
        } else {
            console.log(`  Found existing course: ${mockCourse.title}`);
        }

        const courseId = course.id;

        // Create pages for this course
        for (let pageIndex = 0; pageIndex < mockCourse.pages.length; pageIndex++) {
            const mockPage = mockCourse.pages[pageIndex];

            console.log(`  Creating page: ${mockPage.title}`);

            // Create page
            const { data: page, error: pageError } = await supabase
                .from('page')
                .insert({
                    title: mockPage.title,
                    course_id: courseId,
                    order_index: pageIndex,
                    description: `Assignment ${pageIndex + 1} for ${mockCourse.title}`
                })
                .select('id')
                .single();

            if (pageError) {
                console.error(`    Error creating page:`, pageError);
                continue;
            }

            totalPages++;
            const pageId = page.id;

            // Create blocks for this page
            for (let blockIndex = 0; blockIndex < mockPage.blocks.length; blockIndex++) {
                const mockBlock = mockPage.blocks[blockIndex];

                // Create block
                const { data: block, error: blockError } = await supabase
                    .from('block')
                    .insert({
                        title: mockBlock.title,
                        content: mockBlock.content,
                        order_index: blockIndex
                    })
                    .select('id')
                    .single();

                if (blockError) {
                    console.error(`      Error creating block:`, blockError);
                    continue;
                }

                const blockId = block.id;

                // Link block to page
                const { error: linkError } = await supabase
                    .from('page_blocks')
                    .insert({
                        page_id: pageId,
                        block_id: blockId,
                        order_index: blockIndex
                    });

                if (linkError) {
                    console.error(`      Error linking block to page:`, linkError);
                    continue;
                }

                totalBlocks++;
            }
        }

        console.log('');
    }

    console.log('✅ Seed completed!');
    console.log(`   Created ${totalPages} pages`);
    console.log(`   Created ${totalBlocks} blocks`);
}

seedPagesAndBlocks()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
