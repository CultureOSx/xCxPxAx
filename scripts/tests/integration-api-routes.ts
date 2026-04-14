/**
 * Integration smoke: spawns `npm run server:dev` (Express from `functions/src/app.ts` via tsx).
 *
 * Firestore is optional for a green run:
 * - Without `FIRESTORE_EMULATOR_HOST` / `GOOGLE_APPLICATION_CREDENTIALS` / Cloud runtime,
 *   routes return empty data and RSS/ICS feeds are still valid XML (no live Firestore reads).
 *
 * To exercise real Firestore reads locally:
 * 1. `firebase emulators:start --only firestore` (default host `127.0.0.1:8080`)
 * 2. In the same shell: `export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
 * 3. Optionally `export FIREBASE_PROJECT_ID=culturepass-4f264` (Admin init also defaults this)
 * 4. `npm run test:integration` (this repo uses **npm**, not pnpm, for scripts)
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const base = process.env.INTEGRATION_BASE_URL ?? 'http://127.0.0.1:5050';
const baseUrl = new URL(base);
const serverPort = baseUrl.port || '5050';

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start in time');
}

async function run() {
  const proc = spawn(npmCommand(), ['run', 'server:dev'], {
    stdio: 'ignore',
    env: { ...process.env, PORT: serverPort },
  });
  try {
    await waitForServer();

    // GET /api/communities — returns { communities: FirestoreProfile[] }
    const communitiesRes = await fetch(`${base}/api/communities`);
    assert.equal(communitiesRes.ok, true, 'GET /api/communities should return 200');
    const communitiesBody = await communitiesRes.json() as { communities: { id: string }[] };
    assert.ok(Array.isArray(communitiesBody.communities), 'communities should be an array');

    // GET /api/communities/:id/recommended-events — returns FirestoreEvent[]
    const communityId = String(communitiesBody.communities[0]?.id ?? 'nonexistent');
    const recEventsRes = await fetch(`${base}/api/communities/${encodeURIComponent(communityId)}/recommended-events`);
    assert.equal(recEventsRes.ok, true, 'GET /api/communities/:id/recommended-events should return 200');
    const recEvents = await recEventsRes.json();
    assert.ok(Array.isArray(recEvents), 'recommended events should be an array');

    // GET /api/profiles — returns { profiles: FirestoreProfile[] }
    const profilesRes = await fetch(`${base}/api/profiles`);
    assert.equal(profilesRes.ok, true, 'GET /api/profiles should return 200');
    const profilesBody = await profilesRes.json() as { profiles: unknown[] };
    assert.ok(Array.isArray(profilesBody.profiles), 'profiles should be an array');

    // GET /api/rollout/config — returns RolloutConfig + features map
    const rolloutRes = await fetch(`${base}/api/rollout/config?userId=${encodeURIComponent('qa-integration-user')}`);
    assert.equal(rolloutRes.ok, true, 'GET /api/rollout/config should return 200');
    const rollout = await rolloutRes.json() as Record<string, unknown>;
    assert.ok(typeof rollout === 'object' && rollout !== null, 'rollout config should be an object');
    assert.ok(typeof rollout.phase === 'string', 'rollout config should have a phase field');

    // GET /api/search — returns search results object
    const searchRes = await fetch(`${base}/api/search?q=${encodeURIComponent('culture')}`);
    assert.equal(searchRes.ok, true, 'GET /api/search should return 200');
    const search = await searchRes.json();
    assert.ok(typeof search === 'object' && search !== null, 'search response should be an object');

    // Feed routes
    const rssRes = await fetch(`${base}/api/feeds/city/${encodeURIComponent('Sydney')}.rss?country=${encodeURIComponent('Australia')}`);
    assert.equal(rssRes.ok, true, 'GET /api/feeds/city/:value.rss should return 200');
    const rssText = await rssRes.text();
    assert.ok(rssText.includes('<rss version="2.0"'), 'rss feed should be XML');

    const icalRes = await fetch(`${base}/api/feeds/ical/tag/${encodeURIComponent('culture')}`);
    assert.equal(icalRes.ok, true, 'GET /api/feeds/ical/tag/:value should return 200');
    const icalText = await icalRes.text();
    assert.ok(icalText.includes('BEGIN:VCALENDAR'), 'ical feed should be VCALENDAR');

    console.log('integration api route checks passed');
  } finally {
    proc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
