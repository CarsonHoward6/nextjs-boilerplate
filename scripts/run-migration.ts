// scripts/run-migrations.ts
import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // load Supabase connection

async function runMigrations() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    const migrationsDir = path.join(__dirname, "../lib/migrations");
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    try {
        await client.connect();
        console.log("✅ Connected to database. Running migrations...");

        for (const file of migrationFiles) {
            console.log(`  Running ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
            await client.query(sql);
            console.log(`  ✅ ${file} completed`);
        }

        console.log("✅ All migrations completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigrations();

