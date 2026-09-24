const { execSync } = require('child_process');

const PSQL = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';
const env = { ...process.env, PGPASSWORD: 'postgres' };

try {
  execSync(`${PSQL} -h localhost -p 5432 -U postgres -d charusatneeds -c "TRUNCATE TABLE login_attempts; UPDATE users SET locked_until = NULL;"`, { env, stdio: 'inherit' });
  console.log('User and IP lockouts reset successfully.');
} catch (e) {
  console.error('Error resetting lockouts:', e.message);
}
