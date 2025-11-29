// scripts/seed-users.ts
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need service role key for admin operations
    { auth: { autoRefreshToken: false, persistSession: false } }
);

interface UserSeed {
    email: string;
    password: string;
    fullName: string;
    roles: ('admin' | 'teacher' | 'student' | 'teacher_assistant')[];
    sectionAssignments: { sectionName: string; role: 'teacher' | 'student' | 'teacher_assistant' }[];
}

const users: UserSeed[] = [
    {
        email: "carson6howard@gmail.com", // You as admin
        password: "Admin123!",
        fullName: "Carson Howard",
        roles: ["admin"],
        sectionAssignments: [] // Admin doesn't need section assignments
    },
    {
        email: "john.smith@school.com",
        password: "Teacher123!",
        fullName: "John Smith",
        roles: ["teacher"],
        sectionAssignments: [
            { sectionName: "CS101 - Fall 2024", role: "teacher" },
            { sectionName: "CS201 - Fall 2024", role: "teacher" }
        ]
    },
    {
        email: "jane.doe@school.com",
        password: "Student123!",
        fullName: "Jane Doe",
        roles: ["student", "teacher_assistant"], // Student who is also a TA
        sectionAssignments: [
            { sectionName: "CS101 - Fall 2024", role: "teacher_assistant" },
            { sectionName: "CS301 - Fall 2024", role: "student" }
        ]
    },
    {
        email: "bob.wilson@school.com",
        password: "Student123!",
        fullName: "Bob Wilson",
        roles: ["student"],
        sectionAssignments: [
            { sectionName: "CS101 - Fall 2024", role: "student" },
            { sectionName: "CS201 - Fall 2024", role: "student" }
        ]
    },
    {
        email: "sarah.jones@school.com",
        password: "Teacher123!",
        fullName: "Sarah Jones",
        roles: ["teacher", "teacher_assistant"], // Teacher who also TAs for another class
        sectionAssignments: [
            { sectionName: "CS301 - Fall 2024", role: "teacher" },
            { sectionName: "CS201 - Fall 2024", role: "teacher_assistant" }
        ]
    }
];

const courses = [
    { title: "Introduction to Computer Science" },
    { title: "Data Structures" },
    { title: "Algorithms" }
];

const sections = [
    { courseIndex: 0, title: "CS101 - Fall 2024", year: 2024, semester: "Fall", term: "Full" },
    { courseIndex: 1, title: "CS201 - Fall 2024", year: 2024, semester: "Fall", term: "Full" },
    { courseIndex: 2, title: "CS301 - Fall 2024", year: 2024, semester: "Fall", term: "Full" }
];

async function seedDatabase() {
    const pgClient = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await pgClient.connect();
        console.log("✅ Connected to database");

        // 1. Create courses
        console.log("\n📚 Creating courses...");
        const courseIds: Record<number, string> = {};
        for (let i = 0; i < courses.length; i++) {
            const result = await pgClient.query(
                `INSERT INTO course (title) VALUES ($1)
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [courses[i].title]
            );
            if (result.rows[0]) {
                courseIds[i] = result.rows[0].id;
                console.log(`  ✅ Created course: ${courses[i].title}`);
            } else {
                // Course might already exist, fetch it
                const existing = await pgClient.query(
                    `SELECT id FROM course WHERE title = $1`,
                    [courses[i].title]
                );
                courseIds[i] = existing.rows[0]?.id;
                console.log(`  ℹ️  Course exists: ${courses[i].title}`);
            }
        }

        // 2. Create sections
        console.log("\n📖 Creating sections...");
        const sectionIds: Record<string, string> = {};
        for (const section of sections) {
            const result = await pgClient.query(
                `INSERT INTO section (course_id, title, year, semester, term)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [courseIds[section.courseIndex], section.title, section.year, section.semester, section.term]
            );
            if (result.rows[0]) {
                sectionIds[section.title] = result.rows[0].id;
                console.log(`  ✅ Created section: ${section.title}`);
            } else {
                const existing = await pgClient.query(
                    `SELECT id FROM section WHERE title = $1`,
                    [section.title]
                );
                sectionIds[section.title] = existing.rows[0]?.id;
                console.log(`  ℹ️  Section exists: ${section.title}`);
            }
        }

        // 3. Create users via Supabase Auth
        console.log("\n👥 Creating users...");
        for (const user of users) {
            console.log(`\n  Creating user: ${user.fullName} (${user.email})`);

            // Create auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true
            });

            let userId: string;

            if (authError) {
                if (authError.message.includes("already been registered")) {
                    console.log(`    ℹ️  Auth user exists, fetching...`);
                    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
                    const existingUser = existingUsers?.users.find(u => u.email === user.email);
                    if (!existingUser) {
                        console.error(`    ❌ Could not find existing user: ${user.email}`);
                        continue;
                    }
                    userId = existingUser.id;
                } else {
                    console.error(`    ❌ Auth error: ${authError.message}`);
                    continue;
                }
            } else {
                userId = authData.user.id;
                console.log(`    ✅ Auth user created`);
            }

            // Create user profile
            await pgClient.query(
                `INSERT INTO user_profiles (id, email, full_name)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id) DO UPDATE SET full_name = $3`,
                [userId, user.email, user.fullName]
            );
            console.log(`    ✅ User profile created`);

            // Assign global roles
            for (const role of user.roles) {
                await pgClient.query(
                    `INSERT INTO user_roles (user_id, role)
                     VALUES ($1, $2)
                     ON CONFLICT (user_id, role) DO NOTHING`,
                    [userId, role]
                );
            }
            console.log(`    ✅ Roles assigned: ${user.roles.join(", ")}`);

            // Assign to sections
            for (const assignment of user.sectionAssignments) {
                const sectionId = sectionIds[assignment.sectionName];
                if (sectionId) {
                    await pgClient.query(
                        `INSERT INTO user_sections (user_id, section_id, role)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (user_id, section_id, role) DO NOTHING`,
                        [userId, sectionId, assignment.role]
                    );
                    console.log(`    ✅ Assigned to ${assignment.sectionName} as ${assignment.role}`);
                }
            }
        }

        console.log("\n✅ Seeding completed successfully!");
        console.log("\n📋 User Credentials:");
        console.log("─".repeat(50));
        for (const user of users) {
            console.log(`  ${user.fullName}`);
            console.log(`    Email: ${user.email}`);
            console.log(`    Password: ${user.password}`);
            console.log(`    Roles: ${user.roles.join(", ")}`);
            console.log("");
        }

    } catch (err) {
        console.error("❌ Seeding failed:", err);
    } finally {
        await pgClient.end();
    }
}

seedDatabase();