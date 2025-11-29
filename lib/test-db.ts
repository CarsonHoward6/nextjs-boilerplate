import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // ✅ explicitly load .env.local

export async function seedDatabase() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });


    try {
        await client.connect();

        // ✅ Add sample data
        await client.query(`
      INSERT INTO course (title)
      VALUES ('Intro to Programming'), ('Web Development Basics')
      ON CONFLICT DO NOTHING;
    `);

        await client.query(`
      INSERT INTO page (title)
      VALUES ('Variables and Data Types'), ('Loops and Functions')
      ON CONFLICT DO NOTHING;
    `);

        await client.query(`
      INSERT INTO block (title, content)
      VALUES
        ('Lesson 1: Variables', 'Understanding variables and data types'),
        ('Lesson 2: Loops', 'For loops, while loops, and iterations')
      ON CONFLICT DO NOTHING;
    `);

        console.log("✅ Data inserted successfully!");
    } catch (err) {
        console.error("❌ Failed to insert data:", err);
    } finally {
        await client.end();
    }
}

seedDatabase();
