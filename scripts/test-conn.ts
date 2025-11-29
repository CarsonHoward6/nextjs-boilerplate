import dotenv from 'dotenv';
import { testConnection } from '@/lib/test-db'; // or .ts if allowed

dotenv.config({ path: '.env.local' });

(async () => {
    await testConnection();
    console.log('Test completed');
    process.exit(0);
})();