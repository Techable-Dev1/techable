// ============================================================
//  auth.js — Shared Firebase Auth Module
//  Loaded as <script type="module" src="auth.js">
//  Sets window.TechableAuth for non-module scripts.
// ============================================================

// ── Wait for config ───────────────────────────────────────────
// _cfg resolves once both the API fetch attempt and config.js
// have had a chance to set window.TECHABLE_CONFIG
await window._cfg

const cfg = window.TECHABLE_CONFIG

// ── No config — provide safe stubs so app never crashes ───────
if (!cfg?.firebase?.apiKey) {
  console.warn('auth.js: No Firebase config. Running without auth.')
  window.TechableAuth = {
    ready:       true,
    currentUser: null,
    guard(onReady) {
      // No Firebase — remove loading screen and allow access
      const ov = document.getElementById('auth-loading')
      if (ov) ov.style.display = 'none'
      const pv = document.getElementById('page-content')
      if (pv) pv.style.display = 'block'
      if (onReady) onReady(null)
    },
    signOut:       async () => { window.location.href = 'login.html' },
    updateName:    async () => {},
    deleteAccount: async () => {},
    userName:      () => 'Guest',
    initials:      () => 'G',
    photoURL:      () => null,
    friendlyError: () => 'Auth not configured.',
    signInEmail:   async () => { throw new Error('Auth not configured') },
    signUpEmail:   async () => { throw new Error('Auth not configured') },
    signInGoogle:  async () => { throw new Error('Auth not configured') },
    resetPassword: async () => { throw new Error('Auth not configured') },
  }
  document.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: null }))
  throw new Error('No Firebase config — stubs installed, continuing.')
}

// ── Firebase init ─────────────────────────────────────────────
import { initializeApp, getApps }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js"

const app  = getApps().length ? getApps()[0] : initializeApp(cfg.firebase)
const auth = getAuth(app)
const gp   = new GoogleAuthProvider()
gp.setCustomParameters({ prompt: 'select_account' })

let _user    = null
let _cbs     = []
let _resolved = false

onAuthStateChanged(auth, user => {
  _user     = user
  _resolved = true
  window.TechableAuth.currentUser = user
  _cbs.forEach(cb => cb(user))
  _cbs = []
  document.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: user }))
})

window.TechableAuth = {
  ready:       true,
  currentUser: null,

  guard(onReady) {
    const handle = user => {
      if (!user) { window.location.href = 'login.html'; return }
      const ov = document.getElementById('auth-loading')
      if (ov) ov.style.display = 'none'
      const pv = document.getElementById('page-content')
      if (pv) pv.style.display = 'block'
      if (onReady) onReady(user)
    }
    if (_resolved) handle(_user)
    else _cbs.push(handle)
  },

  async signInEmail(email, password) {
    return (await signInWithEmailAndPassword(auth, email, password)).user
  },
  async signUpEmail(email, password, displayName) {
    const c = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(c.user, { displayName })
    return c.user
  },
  async signInGoogle() {
    return (await signInWithPopup(auth, gp)).user
  },
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  },
  async updateName(name) {
    if (!_user) return
    await updateProfile(_user, { displayName: name })
    window.TechableAuth.currentUser = auth.currentUser
  },
  async signOut() {
    await signOut(auth)
    window.location.href = 'login.html'
  },
  async deleteAccount() {
    if (_user) await deleteUser(_user)
    window.location.href = 'login.html'
  },

  userName: u => (u||_user)?.displayName || (u||_user)?.email?.split('@')[0] || 'User',
  initials: u => {
    const n = (u||_user)?.displayName || (u||_user)?.email || '?'
    return n.split(/[\s@]/).map(w => w[0]).slice(0,2).join('').toUpperCase()
  },
  photoURL: u => (u||_user)?.photoURL || null,

  friendlyError(code) {
    return {
      'auth/user-not-found':        'No account found with that email.',
      'auth/wrong-password':        'Incorrect password. Try again.',
      'auth/email-already-in-use':  'That email is already registered.',
      'auth/weak-password':         'Password must be at least 6 characters.',
      'auth/invalid-email':         'Please enter a valid email address.',
      'auth/invalid-credential':    'Incorrect email or password.',
      'auth/too-many-requests':     'Too many attempts. Try again later.',
      'auth/requires-recent-login': 'Please sign out and sign back in first.',
      'auth/network-request-failed':'Network error. Check your connection.',
    }[code] || 'Something went wrong. Please try again.'
  }
}