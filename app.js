// ============================================================
//  app.js — Techable AI Companion
//  No API required. Fully local.
// ============================================================

// ── STORAGE ─────────────────────────────────────────────────
// Replace method bodies here to switch to Firebase Firestore.
const DB = {
  getResidents()       { return JSON.parse(localStorage.getItem('t_residents') || '[]') },
  saveResidents(d)     { localStorage.setItem('t_residents', JSON.stringify(d)) },
  getSessions(rid)     { return JSON.parse(localStorage.getItem('t_sessions') || '[]').filter(s => s.rid === rid) },
  saveSession(s)       {
    const all = JSON.parse(localStorage.getItem('t_sessions') || '[]')
    const i = all.findIndex(x => x.id === s.id)
    i >= 0 ? all[i] = s : all.push(s)
    localStorage.setItem('t_sessions', JSON.stringify(all))
  }
}

// ── AI LAYER ─────────────────────────────────────────────────
// Uses Gemini when config.aiMode === "gemini", otherwise local engine.
// To switch: change aiMode in config.js — nothing else needs to change.
const AI = {

  intents: [
    { key: 'greeting',    rx: /\b(hello|hi|hey|good morning|good afternoon|good evening)\b/ },
    { key: 'how_are_you', rx: /\b(how are you|how do you feel|you okay|are you well)\b/ },
    { key: 'family',      rx: /\b(family|son|daughter|grandchild|grandkids|husband|wife|children|kids|nephew|niece)\b/ },
    { key: 'hobby',       rx: /\b(hobby|garden|read|music|cook|bak|knit|paint|walk|swim|chess|sew|crochet)\b/ },
    { key: 'memory',      rx: /\b(remember|memory|memor|past|old days|used to|long ago|back when|those days)\b/ },
    { key: 'weather',     rx: /\b(today|weather|outside|sunny|rain|cold|warm|season|hot|cloudy)\b/ },
    { key: 'emotion',     rx: /\b(feel|sad|lonely|miss|upset|worried|anxious|scared|happy|glad|excited|bored)\b/ },
    { key: 'food',        rx: /\b(eat|food|lunch|dinner|breakfast|hungry|meal|cook|favourite food|delicious|taste)\b/ },
    { key: 'rest',        rx: /\b(sleep|tired|rest|nap|night|bed|exhausted)\b/ },
    { key: 'health',      rx: /\b(pain|hurt|ache|doctor|medicine|pill|unwell|sick|hospital|nurse)\b/ },
    { key: 'thanks',      rx: /\b(thank|thanks|thank you|appreciate|grateful)\b/ },
    { key: 'farewell',    rx: /\b(bye|goodbye|see you|take care|good night|goodnight|leaving)\b/ },
    { key: 'media',       rx: /\b(news|television|tv|watch|show|film|movie|programme|radio|book|read)\b/ },
  ],

  templates: {
    greeting:    [
      'Hello {n}! So lovely to hear from you. How has your day been?',
      'Good to see you, {n}! What is on your mind today?',
      'Hello there, {n}! I was just thinking about you. How are you feeling?'
    ],
    how_are_you: [
      "I'm here and happy to chat! More importantly — how are YOU feeling today, {n}?",
      "I'm doing well, thank you! How about you, {n}? How has the day been treating you?",
      "Always good, especially when we get to talk! Tell me, {n} — how are you feeling right now?"
    ],
    family: [
      '{m} Do you hear from them often these days?',
      "Family means so much, doesn't it. {m} Are you expecting any visits soon?",
      "It's lovely to think about the people we love. {m} What do you miss most about them?"
    ],
    hobby: [
      "That sounds wonderful! {m} Do you still get to enjoy that these days?",
      'I love hearing about the things you enjoy. {m} What do you love most about it?',
      "How lovely! {m} Has anything interesting happened with that lately?"
    ],
    memory: [
      "{m} Those kinds of moments stay with us, don't they. What else do you remember from that time?",
      'What a lovely thing to think back on. {m} What brings that to mind today?',
      "I love when you share those memories, {n}. {m} How does it feel to remember that?"
    ],
    weather: [
      'It is always nice to think about the outdoors. Have you been able to get some fresh air today, {n}?',
      "The weather can really affect how we feel, can't it. Are you comfortable right now?",
      "Whatever the weather, I am glad we are chatting! Is there something you would like to do today?"
    ],
    emotion: [
      "Thank you for sharing that with me, {n}. Your feelings are completely valid. Can you tell me more about what is going on?",
      "I hear you, {n}. You do not have to carry that alone. Would it help to talk it through?",
      "I am glad you told me, {n}. What do you think is behind how you are feeling?"
    ],
    food: [
      "Food is one of life's great pleasures! {m} Do you have a favourite meal that always makes you smile?",
      "There is nothing quite like a good meal. {m} What did you have today?",
      "Mmm, talking about food always cheers me up! {m} Is there something you have been craving lately?"
    ],
    rest: [
      "Rest is so important, {n}. I hope you are sleeping well. How have your nights been lately?",
      "It is good to listen to your body. Have you had a proper rest today, {n}?",
      "Sleep makes such a difference to how we feel. Are you getting enough rest, {n}?"
    ],
    health: [
      "I am sorry to hear that, {n}. Have you let a member of the care team know how you are feeling?",
      "Your comfort is the most important thing. Please do speak to someone on the team if something does not feel right, {n}.",
      "Thank you for telling me, {n}. Is there someone nearby you can speak to?"
    ],
    thanks: [
      "It is my pleasure, {n}! That is what I am here for.",
      "Oh, do not mention it! I enjoy every one of our conversations.",
      "You are very welcome, {n}. Any time at all."
    ],
    farewell: [
      "It was lovely chatting with you, {n}. Take good care and I will be here whenever you want to talk.",
      "Goodbye for now, {n}! I will look forward to our next conversation.",
      "Take care, {n}. Rest well — I will be right here when you need me."
    ],
    media: [
      "I love that you enjoy that! Is there something you have been watching or reading lately, {n}?",
      "It is always good to have something interesting to follow. What kind of things do you enjoy most, {n}?",
      "There is so much to enjoy, isn't there! {m} What have you been getting into lately?"
    ],
    general: [
      "That is really interesting, {n}. Tell me more — I would love to hear your thoughts.",
      "You always give me something to think about! What else is on your mind today, {n}?",
      "I love our conversations, {n}. {m} What has been the best part of your day so far?",
      "I hadn't thought about it quite like that. What makes you say that, {n}?"
    ]
  },

  detect(text) {
    const t = text.toLowerCase()
    for (const { key, rx } of this.intents) if (rx.test(t)) return key
    return 'general'
  },

  findMemory(text, resident) {
    if (!resident.memories?.length) return null
    const t = text.toLowerCase()
    for (const m of resident.memories) {
      const words = m.text.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      if (words.some(w => t.includes(w))) return m
    }
    if (Math.random() < 0.3) return resident.memories[Math.floor(Math.random() * resident.memories.length)]
    return null
  },

  fill(template, name, memory) {
    const m = memory
      ? `I remember you once mentioned — ${memory.text}.`
      : ''
    return template.replace(/{n}/g, name).replace(/{m}/g, m).trim()
  },

  async fetchResponse(resident, messages) {
    // Respect AI mode override from profile settings
    const storedMode = localStorage.getItem('t_ai_mode')
    const cfg = { ...(window.TECHABLE_CONFIG || {}), ...(storedMode ? { aiMode: storedMode } : {}) }

    // ── GEMINI ───────────────────────────────────────────────
    if (cfg.aiMode === 'gemini') {
      const key   = cfg.geminiApiKey
      const model = cfg.geminiModel || 'gemini-2.0-flash'

      if (!key || key === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Gemini API key not set. Check your config or Vercel environment variables.')
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

      const contents = messages.map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: this.buildSystemPrompt(resident) }] },
          contents,
          generationConfig: {
            temperature:     0.85,
            maxOutputTokens: 256,
            topP:            0.95
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Gemini error ${res.status}`)
      }

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response from Gemini. Check your API key and quota.')
      return text.trim()
    }

    // ── LOCAL FALLBACK ────────────────────────────────────────
    await new Promise(r => setTimeout(r, 500 + Math.random() * 700))
    const last     = messages.at(-1)?.content || ''
    const intent   = this.detect(last)
    const memory   = this.findMemory(last, resident)
    const name     = resident.preferredName || resident.name || 'friend'
    const variants = this.templates[intent] || this.templates.general
    const t        = variants[Math.floor(Math.random() * variants.length)]
    return this.fill(t, name, memory)
  }
}

// ── VOICE ────────────────────────────────────────────────────
const Voice = {
  rec: null, synth: window.speechSynthesis, on: false,

  init(onResult, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    this.rec = new SR()
    this.rec.continuous = false
    this.rec.interimResults = false
    this.rec.onresult = e => onResult(e.results[0][0].transcript)
    this.rec.onend = () => { this.on = false; onEnd() }
  },
  start() { if (!this.rec) return false; this.rec.start(); this.on = true; return true },
  stop()  { this.rec?.stop(); this.on = false },
  say(text) {
    this.synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.85; u.pitch = 1; u.volume = 1
    const v = this.synth.getVoices().find(v => /samantha|karen|female/i.test(v.name))
    if (v) u.voice = v
    this.synth.speak(u)
  }
}

// ── STATE ────────────────────────────────────────────────────
let residents = []
let currentId = null
let session = null
let sessionStart = null
let msgCount = 0
let timer = null

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  seedSamples()
  residents = DB.getResidents()
  renderList()
  Voice.init(
    text => { $('#chat-input').value = text; setStatus('Heard: ' + text, true); send() },
    ()   => { $('#mic-btn').classList.remove('on'); setStatus('') }
  )
  // auto-open first resident
  if (residents.length) selectRes(residents[0].id)
})

// ── SAMPLE DATA ──────────────────────────────────────────────
function seedSamples() {
  if (!window.TECHABLE_DATA) return
  const existing = DB.getResidents()
  const ids = window.TECHABLE_DATA.residents.map(r => r.id)
  const hasAll = ids.every(id => existing.find(r => r.id === id))
  if (hasAll) return
  DB.saveResidents([...window.TECHABLE_DATA.residents, ...existing.filter(r => !ids.includes(r.id))])
}

function resetSamples() {
  if (!window.TECHABLE_DATA) return
  if (!confirm('Reset sample residents to default data?')) return
  const real = DB.getResidents().filter(r => !r.id.startsWith('sample-'))
  DB.saveResidents([...window.TECHABLE_DATA.residents, ...real])
  residents = DB.getResidents()
  renderList()
  toast('Sample data reset ✓')
}

function clearAll() {
  if (!confirm('Clear ALL data? Cannot be undone.')) return
  localStorage.clear()
  location.reload()
}

// ── SIDEBAR ──────────────────────────────────────────────────

function renderList() {
  const el = $('#res-list')
  el.innerHTML = ''
  residents.forEach(r => {
    const d = make('div', 'res-card' + (r.id === currentId ? ' active' : ''))
    d.dataset.rid = r.id
    d.onclick = () => { selectRes(r.id) }
    d.innerHTML = `
      <div class="res-av">${initials(r.name)}</div>
      <div class="res-info">
        <div class="res-name">${r.name}</div>
        <div class="res-meta">${r.preferredName || ''} · ${r.age ? 'Age ' + r.age : ''}</div>
      </div>`
    el.appendChild(d)
  })
}

// ── SELECT RESIDENT ───────────────────────────────────────────
function selectRes(id) {
  currentId = id
  renderList()
  $('empty-scr', true).style.display = 'none'
  const rv = $('#res-view'); rv.style.display = 'flex'
  const r = getRes()
  $('#rh-av').textContent = initials(r.name)
  $('#rh-name').textContent = r.name
  $('#rh-sub').textContent = [r.preferredName, r.room].filter(Boolean).join(' · ')
  loadForm()
  renderMems()
  renderChips()
  newSession()
}

function getRes() { return residents.find(r => r.id === currentId) }

// ── PROFILE FORM ─────────────────────────────────────────────
function loadForm() {
  const r = getRes()
  if (!r) return
  $('#p-name').value      = r.name || ''
  $('#p-preferred').value = r.preferredName || ''
  $('#p-age').value       = r.age || ''
  $('#p-room').value      = r.room || ''
  $('#p-background').value = r.background || ''
  $('#p-family').value    = r.family || ''
  $('#p-medical').value   = r.medical || ''
}

function saveProfile() {
  const r = getRes(); if (!r) return
  r.name        = $('#p-name').value.trim() || r.name
  r.preferredName = $('#p-preferred').value.trim()
  r.age         = $('#p-age').value
  r.room        = $('#p-room').value.trim()
  r.background  = $('#p-background').value
  r.family      = $('#p-family').value
  r.medical     = $('#p-medical').value
  DB.saveResidents(residents)
  renderList()
  $('#rh-name').textContent = r.name
  $('#rh-sub').textContent  = [r.preferredName, r.room].filter(Boolean).join(' · ')
  toast('Profile saved ✓')
}

function dirty() {} // placeholder for future unsaved-changes warning

// ── MEMORIES ─────────────────────────────────────────────────
function renderMems() {
  const r = getRes()
  const el = $('#mem-list')
  el.innerHTML = ''
  if (!r?.memories?.length) {
    el.innerHTML = '<div class="mem-empty">No memories yet. Add one below.</div>'
    $('#mem-count').textContent = ''
    return
  }
  $('#mem-count').textContent = r.memories.length + ' memories'
  r.memories.forEach((m, i) => {
    const d = make('div', 'mem-row')
    d.innerHTML = `
      <div class="mem-txt">${m.text}</div>
      <div class="mem-tag-badge">${m.tag}</div>
      <button class="mem-x" onclick="delMem(${i})">×</button>`
    el.appendChild(d)
  })
}

function addMem() {
  const r = getRes(); if (!r) return
  const text = $('#mem-input').value.trim(); if (!text) return
  const tag  = $('#mem-tag').value
  ;(r.memories = r.memories || []).push({ text, tag })
  DB.saveResidents(residents)
  $('#mem-input').value = ''
  renderMems(); renderChips()
}

function delMem(i) {
  const r = getRes(); if (!r) return
  r.memories.splice(i, 1)
  DB.saveResidents(residents)
  renderMems(); renderChips()
}

function renderChips() {
  const r = getRes()
  const el = $('#chips')
  if (!r?.memories?.length) {
    el.innerHTML = '<span style="font-size:11px;color:var(--ink3)">No memories yet</span>'
    return
  }
  el.innerHTML = r.memories.map((m, i) =>
    `<span class="chip" id="chip-${i}" title="${m.tag}">${m.text.substring(0, 26)}${m.text.length > 26 ? '…' : ''}</span>`
  ).join('')
}

function lightChip(text, resident) {
  if (!resident.memories) return
  const t = text.toLowerCase()
  resident.memories.forEach((m, i) => {
    const words = m.text.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    if (words.some(w => t.includes(w))) {
      const c = $(`chip-${i}`, true)
      if (!c) return
      c.classList.add('lit')
      setTimeout(() => c.classList.remove('lit'), 3000)
    }
  })
}

// ── CONVERSATION ─────────────────────────────────────────────
function newSession() {
  session = { id: Date.now() + '', rid: currentId, start: new Date().toISOString(), messages: [] }
  sessionStart = Date.now(); msgCount = 0
  const w = $('#chat-win')
  w.innerHTML = `<div class="chat-empty-s"><div class="ce">💬</div><p>Session ready.<br/>Type a message or tap the mic.</p></div>`
  updateStats()
  clearInterval(timer); timer = setInterval(updateStats, 30000)
}

async function send() {
  const inp = $('#chat-input')
  const text = inp.value.trim(); if (!text || !currentId) return
  const r = getRes(); if (!r) return
  inp.value = ''; grow(inp)

  addMsg('u', text)
  session.messages.push({ role: 'user', content: text })
  msgCount++; updateStats()
  lightChip(text, r)

  const tid = showDots()
  setStatus('Techable is thinking…', true)

  try {
    const reply = await AI.fetchResponse(r, session.messages)
    removeDots(tid)
    addMsg('a', reply)
    session.messages.push({ role: 'assistant', content: reply })
    msgCount++; updateStats()
    setStatus('')
    Voice.say(reply)
  } catch(e) {
    removeDots(tid)
    addMsg('a', 'Sorry, something went wrong. ' + e.message)
    setStatus('Error: ' + e.message)
  }
}

function addMsg(role, text) {
  const w = $('#chat-win')
  w.querySelector('.chat-empty-s')?.remove()
  const r = getRes()
  const av = role === 'u' ? '👤' : initials(r?.name || 'T')
  const d = make('div', 'msg ' + role)
  d.innerHTML = `<div class="m-av">${av}</div><div class="m-body">${esc(text)}</div>`
  w.appendChild(d); w.scrollTop = w.scrollHeight
}

function showDots() {
  const w = $('#chat-win')
  const id = 'dots-' + Date.now()
  const d = make('div', 'msg a'); d.id = id
  d.innerHTML = `<div class="m-av">${initials(getRes()?.name || 'T')}</div><div class="m-body dots"><span></span><span></span><span></span></div>`
  w.appendChild(d); w.scrollTop = w.scrollHeight
  return id
}
function removeDots(id) { $(id, true)?.remove() }

function updateStats() {
  const mins = sessionStart ? Math.floor((Date.now() - sessionStart) / 60000) : 0
  $('#s-msgs').textContent = msgCount
  $('#s-dur').textContent  = mins + 'm'
}

function saveSession() {
  if (!session?.messages.length) { toast('Nothing to save yet.'); return }
  session.saved = new Date().toISOString()
  DB.saveSession(session)
  renderHistory(); toast('Session saved ✓')
}

// ── HISTORY ──────────────────────────────────────────────────
function renderHistory() {
  const el = $('#hist-body')
  const sessions = DB.getSessions(currentId)
  if (!sessions.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink3);font-size:13px;">No saved sessions yet.<br/>Save a conversation to see it here.</div>'
    return
  }
  el.innerHTML = ''
  ;[...sessions].reverse().forEach(s => {
    const date = new Date(s.saved || s.start).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
    const first = s.messages.find(m => m.role === 'user')
    const d = make('div', 'sess-card')
    d.innerHTML = `
      <div class="sc-date">${date}</div>
      <div class="sc-prev">${esc((first?.content || 'No messages').substring(0, 90))}…</div>
      <div class="sc-stats">
        <span class="sc-s">Messages: <b>${s.messages.length}</b></span>
      </div>`
    d.onclick = () => loadSession(s)
    el.appendChild(d)
  })
}

function loadSession(s) {
  switchTab('conversation', document.querySelectorAll('.tab-btn')[1])
  session = { ...s }
  const w = $('#chat-win'); w.innerHTML = ''
  s.messages.forEach(m => addMsg(m.role === 'user' ? 'u' : 'a', m.content))
  msgCount = s.messages.length; updateStats()
  setStatus('Viewing saved session — ' + new Date(s.saved || s.start).toLocaleDateString())
}

// ── VOICE ────────────────────────────────────────────────────
function toggleMic() {
  const btn = $('#mic-btn')
  if (Voice.on) { Voice.stop(); btn.classList.remove('on'); setStatus('') }
  else {
    if (Voice.start()) { btn.classList.add('on'); setStatus('Listening…', true) }
    else setStatus('Voice not supported. Use Chrome.')
  }
}

// ── ADD RESIDENT ─────────────────────────────────────────────
function openAddModal() { $('#add-modal').classList.add('open') }
function closeModal(id) { $(`#${id}`, false)?.classList.remove('open'); $('#' + id)?.classList.remove('open') }

function createRes() {
  const name = $('#new-name').value.trim(); if (!name) { alert('Please enter a name.'); return }
  const age  = $('#new-age').value.trim()
  const r = { id: Date.now() + '', name, age, preferredName: '', room: '', background: '', family: '', medical: '', memories: [] }
  residents.push(r); DB.saveResidents(residents)
  renderList()
  document.getElementById('add-modal').classList.remove('open')
  $('#new-name').value = ''; $('#new-age').value = ''
  selectRes(r.id)
}

// ── TABS ─────────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))
  $(`panel-${name}`, true).classList.add('active')
  if (name === 'history') renderHistory()
  if (name === 'conversation') renderChips()
}

// ── UTILS ────────────────────────────────────────────────────
const $  = (id, byId = false) => byId ? document.getElementById(id) : document.querySelector(id)
const make = (tag, cls) => { const d = document.createElement(tag); d.className = cls; return d }
const initials = n => (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
const esc = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')
const setStatus = (msg, on = false) => { const e = $('#status-line'); e.textContent = msg; e.className = 'status-line' + (on ? ' on' : '') }

function grow(el) {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 100) + 'px'
}

function toast(msg) {
  const t = document.createElement('div')
  t.className = 'toast'; t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2400)
}

// close modals on overlay click
document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open') }))

// ── AI STATUS BADGE ───────────────────────────────────────────
// Updates the header badge to show which AI mode is active
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('ai-badge')
  if (!badge) return
  const storedMode = localStorage.getItem('t_ai_mode')
  const cfg = { ...(window.TECHABLE_CONFIG || {}), ...(storedMode ? { aiMode: storedMode } : {}) }
  const keySet = cfg.geminiApiKey && cfg.geminiApiKey !== 'PASTE_YOUR_GEMINI_API_KEY_HERE'
  if (cfg.aiMode === 'gemini' && keySet) {
    badge.textContent = '● Gemini ' + (cfg.geminiModel || 'gemini-2.0-flash')
    badge.style.background = '#EBF5EF'
    badge.style.color      = '#3A7D5C'
  } else if (cfg.aiMode === 'gemini' && !keySet) {
    badge.textContent = '⚠ Gemini key missing'
    badge.style.background = '#FDF0EB'
    badge.style.color      = '#C4552B'
  } else {
    badge.textContent = '● Local Mode'
  }
})

// ── USER MENU ─────────────────────────────────────────────────
function toggleUserMenu() {
  const menu = document.getElementById('usr-menu')
  if (!menu) return
  menu.classList.toggle('open')
}
// close menu when clicking outside
document.addEventListener('click', e => {
  const btn  = document.getElementById('usr-btn')
  const menu = document.getElementById('usr-menu')
  if (!menu) return
  if (!btn?.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('open')
  }
})
