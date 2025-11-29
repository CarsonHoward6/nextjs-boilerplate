import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function createTestNotification() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log("✅ Connected to database");

        // Get a user
        const { rows: users } = await client.query(`
            SELECT id, full_name, email FROM user_profiles LIMIT 1
        `);

        if (users.length === 0) {
            console.error("❌ No users found");
            return;
        }

        const user = users[0];
        console.log(`👤 Creating notification for: ${user.full_name || user.email}`);

        // Get a section this user is assigned to
        const { rows: userSections } = await client.query(`
            SELECT us.*, s.title as section_title, s.course_id
            FROM user_sections us
            JOIN section s ON s.id = us.section_id
            WHERE us.user_id = $1
            LIMIT 1
        `, [user.id]);

        if (userSections.length > 0) {
            const userSection = userSections[0];

            // Create notification for section assignment
            await client.query(`
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                user.id,
                "section_assigned",
                "New Class Assignment!",
                `You have been assigned to ${userSection.section_title} as a ${userSection.role}.`,
                "/lms"
            ]);

            console.log(`✅ Created notification for section assignment`);
        }

        // Create a general notification
        await client.query(`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            user.id,
            "role_assigned",
            "Welcome to the LMS!",
            "Your account has been set up successfully. Start exploring your courses and assignments.",
            "/lms"
        ]);

        console.log(`✅ Created welcome notification`);
        console.log("\n🎉 Test notifications created successfully!");

    } catch (err) {
        console.error("❌ Error creating notifications:", err);
    } finally {
        await client.end();
    }
}

createTestNotification();