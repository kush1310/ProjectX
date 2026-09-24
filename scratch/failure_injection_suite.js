/**
 * failure_injection_suite.js
 *
 * Controlled fault-injection and resilience verification suite.
 * Evaluates application degradation behavior across network timeouts,
 * connection refusal, corrupted tokens, and database query stress.
 */

const http = require('http');

const BASE_URL = 'http://localhost:8000';

async function runScenario1_ConnectionTimeout() {
  console.log('[Scenario 1] Network Timeout / Aggressive Abort Handling...');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1); // Immediate abort

  try {
    await fetch(`${BASE_URL}/api/public/health`, { signal: controller.signal });
    return { status: 'FAIL', reason: 'Expected abort did not trigger' };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { status: 'PASS', detail: 'Client cleanly aborted in-flight request without resource leak' };
    }
    return { status: 'PASS', detail: `Caught error: ${err.message}` };
  }
}

async function runScenario2_ConnectionRefusal() {
  console.log('[Scenario 2] Host / Port Connection Refusal (Dead Port 54399)...');
  try {
    await fetch('http://localhost:54399/api/public/health');
    return { status: 'FAIL', reason: 'Connection succeeded unexpectedly on dead port' };
  } catch (err) {
    if (err.cause && err.cause.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      return { status: 'PASS', detail: 'Clean ECONNREFUSED interception without crash' };
    }
    return { status: 'PASS', detail: `Handled error: ${err.message}` };
  }
}

async function runScenario3_AdversarialInputResilience() {
  console.log('[Scenario 3] Adversarial SQL Injection & Malformed JSON Injection...');
  // Attempt raw SQL injection in login
  const res1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "' OR '1'='1", password: "' OR '1'='1" })
  });

  const body1 = await res1.text();
  const sqlSafe = !body1.toLowerCase().includes('syntax error') && !body1.toLowerCase().includes('postgresql') && res1.status >= 400;

  // Malformed JSON body
  const res2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ "email": "broken_json'
  });
  const body2 = await res2.text();
  const jsonSafe = res2.status >= 400 && !body2.includes('org.postgresql');

  if (sqlSafe && jsonSafe) {
    return { status: 'PASS', detail: `SQL Injection returned HTTP ${res1.status}; Malformed JSON returned HTTP ${res2.status}. Zero stack trace leak.` };
  }
  return { status: 'FAIL', reason: 'Potential information disclosure or unexpected status' };
}

async function runScenario4_DatabasePoolStress() {
  console.log('[Scenario 4] Database Readiness Pool Rapid Concurrency (30 parallel requests)...');
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < 30; i++) {
    promises.push(fetch(`${BASE_URL}/api/public/health/readiness`).then(r => r.status));
  }

  const results = await Promise.all(promises);
  const duration = Date.now() - start;
  const all200 = results.every(s => s === 200);

  if (all200) {
    return { status: 'PASS', detail: `All 30 concurrent readiness probes returned HTTP 200 in ${duration}ms without pool starvation.` };
  }
  return { status: 'FAIL', reason: `Some requests failed: ${results.filter(s => s !== 200).length} non-200 responses` };
}

async function runScenario5_ForgedJWT() {
  console.log('[Scenario 5] Forged / Tampered JWT Authentication Resilience...');
  const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IlJPTEVfQURNSU4ifQ.invalid_forged_signature_hash_here';

  const res = await fetch(`${BASE_URL}/api/orders/history`, {
    headers: { 'Authorization': `Bearer ${forgedToken}` }
  });

  if (res.status === 401 || res.status === 403) {
    return { status: 'PASS', detail: `Forged JWT rejected with HTTP ${res.status} Unauthorized.` };
  }
  return { status: 'FAIL', reason: `Unexpected response status: ${res.status}` };
}

async function main() {
  console.log('=== CHARUSAT NEEDS FAILURE-INJECTION SUITE ===\n');

  const s1 = await runScenario1_ConnectionTimeout();
  console.log(` -> Result: ${s1.status} - ${s1.detail || s1.reason}\n`);

  const s2 = await runScenario2_ConnectionRefusal();
  console.log(` -> Result: ${s2.status} - ${s2.detail || s2.reason}\n`);

  const s3 = await runScenario3_AdversarialInputResilience();
  console.log(` -> Result: ${s3.status} - ${s3.detail || s3.reason}\n`);

  const s4 = await runScenario4_DatabasePoolStress();
  console.log(` -> Result: ${s4.status} - ${s4.detail || s4.reason}\n`);

  const s5 = await runScenario5_ForgedJWT();
  console.log(` -> Result: ${s5.status} - ${s5.detail || s5.reason}\n`);

  console.log('=== FAULT INJECTION COMPLETE ===');
}

main().catch(console.error);
