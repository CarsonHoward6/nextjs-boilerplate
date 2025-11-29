import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seedAnnouncements() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log("✅ Connected to database");

        // Get a section to add announcements to
        const { rows: sections } = await client.query(`
            SELECT id, title FROM section LIMIT 1
        `);

        if (sections.length === 0) {
            console.error("❌ No sections found. Please run seed-course-sections first.");
            return;
        }

        const section = sections[0];
        console.log(`📍 Using section: ${section.title} (${section.id})`);

        // Get a teacher user for this section
        const { rows: teachers } = await client.query(`
            SELECT user_id FROM user_sections
            WHERE section_id = $1 AND role = 'teacher'
            LIMIT 1
        `, [section.id]);

        let authorId: string;

        if (teachers.length > 0) {
            authorId = teachers[0].user_id;
            console.log(`👤 Using existing teacher as author: ${authorId}`);
        } else {
            // Get any user
            const { rows: users } = await client.query(`
                SELECT id FROM user_profiles LIMIT 1
            `);

            if (users.length === 0) {
                console.error("❌ No users found. Please create a user first.");
                return;
            }

            authorId = users[0].id;
            console.log(`👤 Using user as author: ${authorId}`);
        }

        // Create 5 example announcements
        const announcements = [
            {
                title: "Welcome to the Course!",
                content: "Welcome everyone! I'm excited to have you all in this class. Please make sure to review the syllabus and complete the first assignment by Friday. If you have any questions, feel free to reach out during office hours or post in the discussion forum.",
                priority: "high",
                is_pinned: true
            },
            {
                title: "Midterm Exam Schedule",
                content: "The midterm exam will be held next Wednesday, March 15th, from 2:00 PM to 4:00 PM in the main lecture hall. The exam will cover chapters 1-5. Remember to bring your student ID and a pencil. Good luck with your studies!",
                priority: "urgent",
                is_pinned: true
            },
            {
                title: "Guest Lecture Tomorrow",
                content: "We have a special guest lecturer tomorrow! Dr. Sarah Johnson from MIT will be joining us to discuss recent developments in the field. This is a great opportunity to learn from an expert, so please don't miss it.",
                priority: "normal",
                is_pinned: false
            },
            {
                title: "Assignment 3 Posted",
                content: "Assignment 3 has been posted and is now available in the course materials section. The assignment is due two weeks from today. Please start early and don't hesitate to ask questions if you need clarification on any of the problems.",
                priority: "normal",
                is_pinned: false
            },
            {
                title: "Office Hours Update",
                content: "Due to a scheduling conflict, my office hours this Thursday will be moved from 3:00 PM to 4:30 PM. The location remains the same (Room 204). Apologies for any inconvenience this may cause.",
                priority: "low",
                is_pinned: false
            }
        ];

        for (const announcement of announcements) {
            await client.query(`
                INSERT INTO announcements (section_id, author_id, title, content, priority, is_pinned)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [section.id, authorId, announcement.title, announcement.content, announcement.priority, announcement.is_pinned]);

            console.log(`✅ Created announcement: "${announcement.title}"`);
        }

        console.log("\n🎉 Successfully seeded 5 announcements!");
        console.log(`\n📝 Announcements added to section: ${section.title}`);
        console.log(`👤 Author: ${authorId}`);

    } catch (err) {
        console.error("❌ Error seeding announcements:", err);
    } finally {
        await client.end();
    }
}

seedAnnouncements();