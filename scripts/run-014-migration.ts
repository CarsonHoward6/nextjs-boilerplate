import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigration() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync(
            path.join(process.cwd(), 'lib/migrations/014_admin_user_notifications.sql'),
            'utf8'
        );

        await client.query(sql);
        console.log('✅ Migration 014_admin_user_notifications.sql completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

runMigration();
