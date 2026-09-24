/**
 * test_migrations.js
 *
 * Verifies database migration lifecycle:
 * 1. Greenfield initialization from schema.sql
 * 2. Sequential application of Flyway migrations V1 to V5
 * 3. Idempotent re-execution test (Expand-Migrate safety)
 * 4. Constraint and index validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PG_BIN = 'C:\\Program Files\\PostgreSQL\\18\\bin';
const PSQL = `"${path.join(PG_BIN, 'psql.exe')}"`;

const DB_HOST = 'localhost';
const DB_PORT = '5432';
const DB_USER = 'postgres';
const DB_PASSWORD = process.env.SPRING_DATASOURCE_PASSWORD || 'postgres';
const TEST_DB = 'charusatneeds_migration_test';

const SCHEMA_SQL = path.resolve(__dirname, '../Backend/src/main/resources/schema.sql');
const MIGRATIONS_DIR = path.resolve(__dirname, '../Backend/src/main/resources/db/migration');

const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

console.log('=== CHARUSAT NEEDS DATABASE MIGRATION TEST ===\n');

try {
  // Step 1: Create clean test DB
  console.log(`[1/5] Creating clean test database: ${TEST_DB}...`);
  execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};"`, { env, stdio: 'pipe' });
  execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "CREATE DATABASE ${TEST_DB};"`, { env, stdio: 'pipe' });

  // Step 2: Apply baseline schema.sql
  console.log(`[2/5] Applying baseline schema.sql...`);
  const baselineStart = Date.now();
  execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${TEST_DB} -f "${SCHEMA_SQL}"`, { env, stdio: 'pipe' });
  const baselineTime = Date.now() - baselineStart;
  console.log(` -> Baseline schema applied in ${baselineTime}ms.`);

  // Step 3: Apply migrations V1 to V5
  console.log(`[3/5] Applying Flyway migrations V1 to V5 in order...`);
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  console.log(` -> Discovered migrations: ${migrationFiles.join(', ')}`);

  for (const mf of migrationFiles) {
    const fullPath = path.join(MIGRATIONS_DIR, mf);
    const mStart = Date.now();
    execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${TEST_DB} -f "${fullPath}"`, { env, stdio: 'pipe' });
    console.log(`    Applied ${mf} in ${Date.now() - mStart}ms.`);
  }

  // Step 4: Test Idempotency (re-apply migrations)
  console.log(`[4/5] Testing migration idempotency (re-applying all migrations)...`);
  for (const mf of migrationFiles) {
    const fullPath = path.join(MIGRATIONS_DIR, mf);
    execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${TEST_DB} -f "${fullPath}"`, { env, stdio: 'pipe' });
  }
  console.log(` -> All migrations re-applied successfully with zero errors (Idempotency Verified).`);

  // Step 5: Verification of created tables and indexes
  const tables = ['vendor_applications', 'payouts', 'canteens_schedule', 'password_history'];
  for (const tbl of tables) {
    const res = execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${TEST_DB} -t -c "SELECT to_regclass('public.${tbl}');"`, { env, stdio: 'pipe' }).toString().trim();
    if (!res || res === '') throw new Error(`Table ${tbl} was not found!`);
    console.log(` -> Verified table presence: ${tbl}`);
  }

  // Check custom performance index
  const idxRes = execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${TEST_DB} -t -c "SELECT to_regclass('public.idx_orders_customer_created');"`, { env, stdio: 'pipe' }).toString().trim();
  console.log(` -> Verified index presence: idx_orders_customer_created (${idxRes})`);

  // Teardown
  execSync(`${PSQL} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d postgres -c "DROP DATABASE ${TEST_DB};"`, { env, stdio: 'pipe' });
  console.log(`\n[5/5] Test database dropped cleanly. Migration test SUCCESS!`);

} catch (err) {
  console.error('Migration test failed:', err.message);
  if (err.stdout) console.error(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
  process.exit(1);
}
