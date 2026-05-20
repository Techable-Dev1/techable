// config.js — LOCAL DEVELOPMENT ONLY
// This file is gitignored and never deployed.
// On Vercel, keys come from api/config.js reading process.env instead.

window.TECHABLE_CONFIG = {
  geminiApiKey: "AIzaSyBPn3ZZoyS7Y0dcYu4sMNn_sZ4RGd9cg8k",
  geminiModel:  "gemini-2.0-flash",
  aiMode:       "gemini",
  firebase: {
    apiKey:            "AIzaSyAbX7eWUMA2oWh6g90GVzxwmHl-_-BSg7o",
    authDomain:        "gen-lang-client-0628837322.firebaseapp.com",
    projectId:         "gen-lang-client-0628837322",
    storageBucket:     "gen-lang-client-0628837322.firebasestorage.app",
    messagingSenderId: "144412356756",
    appId:             "1:144412356756:web:3239a31de789ffa8fd8481",
    measurementId:     "G-Y7NLD11R25"
  }
}