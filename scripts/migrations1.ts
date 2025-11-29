import dotenv from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

async function runMigration() {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('❌ POSTGRES_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔄 Running database migration...');
        console.log('Connecting to database...');

        await client.connect();
        console.log('✅ Connected!');

        const migrationSQL = readFileSync(
            join(process.cwd(), 'lib', 'migrations', '001_create_course_tables.sql'),
            'utf-8'
        );

        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('\nCreated tables:');
        console.log('  - block');
        console.log('  - course');
        console.log('  - page');
        console.log('  - section');
        console.log('  - page_blocks (junction table)');
        console.log('  - section_pages (junction table)');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        process.exit(0);
    }
}

runMigration();