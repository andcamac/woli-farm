/* ═══════════════════════════════════════════
   FIREBASE CONFIG — Woli Farm
   Credenciales de tu proyecto Firebase
═══════════════════════════════════════════ */

const firebaseConfig = {
  apiKey:            "AIzaSyAMiVlybrhAd9ymLsWK0r96-3PAPzsgf0A",
  authDomain:        "wolifarm.firebaseapp.com",
  projectId:         "wolifarm",
  storageBucket:     "wolifarm.firebasestorage.app",
  messagingSenderId: "139390791572",
  appId:             "1:139390791572:web:90d876f6a0429c30816981",
  measurementId:     "G-JR1345HJEQ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios globales usados por auth.js y security.js
const auth = firebase.auth();
const db   = firebase.firestore();

// Persistencia offline
db.enablePersistence().catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore: múltiples pestañas abiertas.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore: navegador sin soporte de persistencia.');
  }
});
