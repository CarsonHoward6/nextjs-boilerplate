// scripts/apply-fixes.ts
import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const filesToRun = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [
        "FIX_RLS_RECURSION_FINAL.sql",
        "SEED_COURSES.sql"
    ];

async function applyFixes() {
    console.log("🚀 Starting database fixes...");

    if (!process.env.POSTGRES_URL) {
        console.error("❌ Error: POSTGRES_URL is missing in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log("✅ Connected to database.");

        const projectRoot = path.join(__dirname, "..");

        for (const fileName of filesToRun) {
            console.log(`\n📄 Processing ${fileName}...`);
            const filePath = path.join(projectRoot, fileName);

            if (!fs.existsSync(filePath)) {
                console.error(`  ❌ File not found: ${filePath}`);
                continue;
            }

            const sql = fs.readFileSync(filePath, "utf8");
            await client.query(sql);
            console.log(`  ✅ ${fileName} executed successfully.`);
        }

        console.log("\n✨ All fixes applied successfully! infinite recursion should be gone and courses seeded.");
    } catch (err) {
        console.error("❌ Error executing fixes:", err);
    } finally {
        await client.end();
    }
}

applyFixes();
