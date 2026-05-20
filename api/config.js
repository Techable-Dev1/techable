// api/config.js — Vercel Serverless Function
// Returns app config from environment variables.
// Keys stay server-side, never in client code.

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 'no-store')

  const missing = []
  if (!process.env.GEMINI_API_KEY)    missing.push('GEMINI_API_KEY')
  if (!process.env.FIREBASE_API_KEY)  missing.push('FIREBASE_API_KEY')
  if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID')

  if (missing.length) {
    console.warn('Missing env vars:', missing.join(', '))
  }

  res.status(200).json({
    geminiApiKey:  process.env.GEMINI_API_KEY   || '',
    geminiModel:   process.env.GEMINI_MODEL     || 'gemini-2.0-flash',
    aiMode:        process.env.AI_MODE          || 'gemini',
    firebase: {
      apiKey:            process.env.FIREBASE_API_KEY            || '',
      authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || '',
      projectId:         process.env.FIREBASE_PROJECT_ID         || '',
      storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID|| '',
      appId:             process.env.FIREBASE_APP_ID             || '',
      measurementId:     process.env.FIREBASE_MEASUREMENT_ID     || ''
    }
  })
}
