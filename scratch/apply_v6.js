const { execSync } = require('child_process');
const path = require('path');

const PSQL = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';
const MIGRATION = path.resolve(__dirname, '../Backend/src/main/resources/db/migration/V6__scheduled_orders.sql');
const env = { ...process.env, PGPASSWORD: 'postgres' };

try {
  execSync(`${PSQL} -h localhost -p 5432 -U postgres -d charusatneeds -f "${MIGRATION}"`, { env, stdio: 'inherit' });
  console.log('V6 Migration Applied Successfully!');
} catch (e) {
  console.error('Error applying migration:', e.message);
  process.exit(1);
}
