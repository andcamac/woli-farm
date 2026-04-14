/* ═══════════════════════════════════════════
   AUTH — Firebase Authentication & Cloud Save
   Woli Farm · Web3 Demo
   Login Google, email/pass, registro, reset
   Cloud save/load vinculado a state.js real
═══════════════════════════════════════════ */
'use strict';

/* ── AUTH STATE LISTENER ── */
auth.onAuthStateChanged(async (user) => {
  if (user) {
    await ensureUserDoc(user);
    // Guardar sesión en sessionStorage para el juego
    sessionStorage.setItem('woli_uid', user.uid);
    sessionStorage.setItem('woli_user', JSON.stringify({
      uid:         user.uid,
      displayName: user.displayName || _extractName(user.email),
      email:       user.email,
      photoURL:    user.photoURL || _avatarUrl(user.displayName || user.email)
    }));
  } else {
    sessionStorage.removeItem('woli_uid');
    sessionStorage.removeItem('woli_user');
  }
});

/* ── GOOGLE LOGIN ── */
async function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    // Si el popup fue bloqueado, usar redirect
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await auth.signInWithRedirect(provider);
    }
    throw err;
  }
}

/* ── EMAIL LOGIN ── */
async function loginEmail(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

/* ── EMAIL SIGNUP ── */
async function signupEmail(email, password, displayName) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await cred.user.updateProfile({ displayName });
  }
  return cred;
}

/* ── PASSWORD RESET ── */
async function resetPassword(email) {
  return auth.sendPasswordResetEmail(email);
}

/* ── SIGN OUT ── */
async function signOut() {
  return auth.signOut();
}

/* ═══════════════════════════════════════════
   FIRESTORE — Cloud Save / Load
   Vinculado a las variables reales de state.js:
   coins, water, fert, seeds, health, etc.
═══════════════════════════════════════════ */

async function ensureUserDoc(user) {
  const ref = db.collection('users').doc(user.uid);
  const doc = await ref.get();
  if (!doc.exists) {
    await ref.set({
      displayName:          user.displayName || _extractName(user.email),
      email:                user.email,
      photoURL:             user.photoURL || '',
      createdAt:            firebase.firestore.FieldValue.serverTimestamp(),
      // Mapeado a los campos reales de state.js
      coins:                80,   // Bono de bienvenida (igual que START_COINS)
      totalCyclesCompleted: 0,
      gameState:            null
    });
  }
}

/* CloudSave — API pública para usar desde state.js y main.js */
window.CloudSave = {

  // Guarda el estado completo (s = objeto State real de state.js)
  async save(s) {
    const user = auth.currentUser;
    if (!user || !s) return;
    try {
      await db.collection('users').doc(user.uid).update({
        coins:                s.coins    ?? 0,
        totalCyclesCompleted: s.totalCyclesCompleted ?? 0,
        gameState:            s,
        savedAt:              firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      // Si el doc no existe aún, usar set
      if (e.code === 'not-found') {
        await ensureUserDoc(user);
        await this.save(s);
      } else {
        console.warn('CloudSave.save:', e.message);
      }
    }
  },

  // Carga el gameState guardado en Firestore
  async load() {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (!doc.exists) return null;
      return doc.data().gameState || null;
    } catch (e) {
      console.warn('CloudSave.load:', e.message);
      return null;
    }
  },

  isLoggedIn()     { return !!auth.currentUser; },
  getCurrentUser() { return auth.currentUser; }
};

/* ── HELPERS ── */
function _extractName(email) {
  if (!email) return 'Agricultor';
  return email.split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function _avatarUrl(name) {
  const initials = (name || 'W').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a4a28&color=6ee0a0&size=64&bold=true`;
}

function _friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No hay cuenta con ese correo.',
    'auth/wrong-password':         'Contraseña incorrecta.',
    'auth/invalid-credential':     'Correo o contraseña incorrectos.',
    'auth/email-already-in-use':   'Ya existe una cuenta con ese correo.',
    'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':          'El correo ingresado no es válido.',
    'auth/too-many-requests':      'Demasiados intentos. Esperá unos minutos.',
    'auth/network-request-failed': 'Sin conexión. Revisá tu internet.',
    'auth/popup-closed-by-user':   'Cerraste el popup. Intentá de nuevo.',
  };
  return map[code] || `Error (${code})`;
}
