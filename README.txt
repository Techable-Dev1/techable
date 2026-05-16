================================================================================
TECHABLE — LOCAL SETUP
================================================================================

WHAT THIS IS
A local web app prototype for the Techable AI companion system.
Runs entirely in your browser. No server needed to start.

--------------------------------------------------------------------------------
HOW TO RUN LOCALLY
--------------------------------------------------------------------------------

1. Put both files in the same folder:
   - index.html
   - app.js

2. Open index.html in Google Chrome
   (Voice features require Chrome — Safari and Firefox have limited support)

3. Click "⚙ Set API Key" in the top right
   Enter your Anthropic API key (get one at console.anthropic.com)
   Your key is saved in localStorage only — never sent anywhere else

4. Click "+ Add Resident" in the sidebar
   Add a resident's name and age

5. Fill in their Profile & Memories tab
   The more context you add, the better the AI conversations will be

6. Go to the Conversation tab and start talking

--------------------------------------------------------------------------------
FILE STRUCTURE
--------------------------------------------------------------------------------

techable/
├── index.html      — UI and layout
├── app.js          — All logic (Storage, AI, Voice, App state)
└── README.txt      — This file

--------------------------------------------------------------------------------
EXTENDING TO FIREBASE / GOOGLE CLOUD
--------------------------------------------------------------------------------

All extension points are clearly marked in app.js with comments like:
  // FIREBASE: ...
  // GOOGLE VERTEX AI EXTENSION POINT: ...
  // GOOGLE CLOUD TTS EXTENSION: ...

STEP 1 — Add Firebase to index.html
  Add before </body>:
  <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore-compat.js"></script>
  <script>
    const firebaseConfig = { apiKey: "...", projectId: "...", ... };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  </script>

STEP 2 — Replace Storage methods in app.js
  Replace getResidents(), saveResidents(), getSessions(), saveSession()
  with Firestore calls (commented examples already in app.js)

STEP 3 — Replace AI provider (optional)
  Swap AI.fetchAIResponse() for Google Vertex AI / Gemini
  Extension point already commented in app.js

STEP 4 — Replace Voice TTS (optional)
  Swap Voice.speak() for Google Cloud Text-to-Speech
  Extension point already commented in app.js

--------------------------------------------------------------------------------
WHAT THE APP DOES RIGHT NOW
--------------------------------------------------------------------------------

✓ Add multiple residents with profiles
✓ Memory bank — add specific memories by category (family, hobby, event, etc.)
✓ AI conversation using Claude with full memory context in system prompt
✓ Voice input via Web Speech API (Chrome)
✓ Voice output (text-to-speech, slower pace for elderly users)
✓ Memory chips highlight during conversation when a memory is triggered
✓ Session saving and history view
✓ All data persists in localStorage (survives browser refresh)

--------------------------------------------------------------------------------
WHAT TO BUILD NEXT
--------------------------------------------------------------------------------

Phase 2 — Firebase
  - Move to Firestore for multi-device sync
  - Firebase Auth for care staff login
  - Firebase Storage for family photo uploads
  - Cloud Functions for daily wellbeing summary email

Phase 3 — Robot integration
  - Run app.js logic on Raspberry Pi
  - Replace Web Speech API with ReSpeaker mic input
  - Replace browser TTS with ElevenLabs for more natural voice
  - Trigger display of family photos when memory is recalled
  - Log emotion data from voice using Hume AI or pyAudioAnalysis

Phase 4 — Analytics
  - Firebase Analytics for session tracking
  - Wellbeing score trends over time
  - Daily summary report for care staff
  - Export to PDF for doctor handover

================================================================================
END
================================================================================
