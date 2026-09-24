const { execSync } = require('child_process');
const PSQL = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';
const env = { ...process.env, PGPASSWORD: 'postgres' };

const res = execSync(`${PSQL} -h localhost -p 5432 -U postgres -d charusatneeds -c "UPDATE users SET password = (SELECT password FROM users WHERE email = 'admin@charusat.edu.in'), is_active = true, is_email_verified = true WHERE email IN ('kush@charusat.edu.in', 'honest@charusat.edu.in'); TRUNCATE TABLE login_attempts; UPDATE users SET locked_until = NULL;"`, { env }).toString();
console.log(res);
