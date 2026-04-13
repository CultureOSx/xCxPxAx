// @ts-nocheck
import * as admin from 'firebase-admin';

const UID = '1VLiq1SEUzWNM7J2XScWn3UbFI52';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'culturepass-4f264',
  });
}

async function run() {
  const user = await admin.auth().getUser(UID);
  const existing = user.customClaims ?? {};
  await admin.auth().setCustomUserClaims(UID, { ...existing, role: 'platformAdmin' });
  await admin.firestore().collection('users').doc(UID).set({ role: 'platformAdmin' }, { merge: true });
  console.log('Done!');
  console.log('  Email:', user.email);
  console.log('  UID:  ', UID);
  console.log('  Role:  platformAdmin');
  console.log('\nSign out and back in for the role to take effect.');
}

run().catch(e => { console.error(e); process.exit(1); });
