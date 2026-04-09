import assert from 'node:assert/strict';
import { redirectSystemPath } from '../app/+native-intent';
import { sanitizeInternalRedirect } from '../lib/routes';

const cases: { input: string; initial?: boolean; expected: string }[] = [
  { input: '/events/e1', expected: '/event/e1' },
  { input: '/artists/a1', expected: '/artist/a1' },
  { input: '/communities/c1?ref=push', expected: '/community/c1?ref=push' },
  { input: '/profiles/p1', expected: '/profile/p1' },
  { input: '/users/u1', expected: '/user/u1' },
  { input: '/businesses/b1', expected: '/business/b1' },
  { input: '/home', initial: true, expected: '/(tabs)' },
  { input: '/tickets/t1', expected: '/tickets/t1' },
];

for (const test of cases) {
  const actual = redirectSystemPath({ path: test.input, initial: Boolean(test.initial) });
  assert.equal(actual, test.expected, `Expected ${test.input} => ${test.expected}, got ${actual}`);
}

assert.equal(redirectSystemPath({ path: '', initial: false }), '/');
assert.equal(sanitizeInternalRedirect('/events/e1?ref=push'), '/event/e1?ref=push');
assert.equal(sanitizeInternalRedirect('/(onboarding)/login'), null);
assert.equal(sanitizeInternalRedirect('https://culturepass.app/event/e1'), null);

console.log('native-intent route normalization checks passed');
