import 'dotenv/config';
import admin from 'firebase-admin';

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const uid = process.argv[2];

if (!uid) {
  console.error('Please provide the Firebase User UID.');
  process.exit(1);
}

await admin.auth(app).setCustomUserClaims(uid, {
  admin: true
});

console.log('Admin permission successfully assigned.');
console.log('UID:', uid);

await app.delete();