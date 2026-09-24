const { execSync } = require('child_process');

const PSQL = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';
const env = { ...process.env, PGPASSWORD: 'postgres' };

try {
  const res = execSync(`${PSQL} -h localhost -p 5432 -U postgres -d charusatneeds -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;"`, { env }).toString();
  console.log(res);
} catch (e) {
  console.error(e.message);
}
