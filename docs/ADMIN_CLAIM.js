// Run this ONCE from a trusted Node environment after installing firebase-admin.
// Do not expose service-account credentials in frontend code.
//
// const admin = require('firebase-admin');
// admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
// await admin.auth().setCustomUserClaims('FIREBASE_USER_UID', {admin:true});
// console.log('Admin claim set.');
