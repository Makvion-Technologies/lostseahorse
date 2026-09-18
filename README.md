# lost seahorse

Premium typing site. No login. Practice, race a stranger, or race friends.

```bash
npm install
npm run dev          # Next.js at http://localhost:3000
npm run party        # PartyKit at http://127.0.0.1:1999
```

Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_STRIPE_LINK` for donate.

---

Lost Seahorse — Grok Build brief
Paste this as the project spec. Build in the order at the bottom. Do not skip security or the no-account rule.

Product
Domain: lostseahorse.com

App: premium typing site. No login. No signup.
Three modes only:

Practice — solo, instant, no server
Race a stranger — match human in WPM band, else AI that looks like a player
Race friends — create/join room via link /r/[code]

Rewards = plankton (not coins), stored in localStorage.

Payment = Stripe Payment Link donate / “buy shrimp” for cosmetics only (never speed).

Win → beautiful share card + Share on X.

Non‑negotiables

Fast first paint. Practice works with JS-lite after hydration.
Race UI must stay 60fps while typing. No 3D in the race scene.
3D / cinematic motion = landing + lobby + results only.
Light + dark mode, no flash (next-themes).
Server is source of truth for race text, start time, scores.
Never trust client WPM.
Sanitize display names. No XSS.
No chat. No global leaderboard. No accounts.
Empty stranger queue must still start a race (AI fill).

Tech stack

Next.js (App Router) + TypeScript + React
Tailwind CSS + CSS variables
next-themes
Motion (motion/react) for UI
Three.js + @react-three/fiber + @react-three/drei — homepage hero + result seahorse only
PartyKit + partysocket — rooms + matchmaking
@vercel/og — X share images
Stripe Payment Link (env URL)
Host: Vercel (frontend + OG). PartyKit on Cloudflare.

Do not add: NextAuth, Prisma, Redux, MUI, chat, database for users.

Folder structure
textlost-seahorse/
  app/
    layout.tsx
    page.tsx                 # 3 doors + 3D hero
    practice/page.tsx
    race/page.tsx            # stranger queue
    r/[code]/page.tsx        # friend room
    shop/page.tsx            # optional donate
    api/og/route.tsx
    globals.css
  components/
    ui/                      # Button, Card, Modal, ThemeToggle
    ocean/                   # 2D background layers
    seahorse/
      SeahorseSVG.tsx        # recolorable SVG for races
      Seahorse3D.tsx         # R3F, landing/results only
    typing/
      RaceTrack.tsx
      TypingPane.tsx
      Caret.tsx
      ResultBoard.tsx
      ShareBar.tsx
    lobby/
      SetupForm.tsx
      WaitingRoom.tsx
  lib/
    words.ts
    generatePassage.ts
    wpm.ts
    bands.ts
    storage.ts               # localStorage schema
    names.ts                 # sanitize
    ai/
      pool.ts                # 60+ fake racers
      typer.ts               # human-like timing
    party/
      events.ts              # typed messages
  party/
    race-room.ts
    matchmaker.ts
  public/
    words/easy.json
    words/medium.json
    words/hard.json
    brand/
  partykit.json
  tailwind.config.ts
  .env.example

Data in the browser only
lib/storage.ts keys:
TypeScripttype Save = {
  name: string
  style: string
  color: string
  theme: "light" | "dark" | "system"
  wpm?: number           // rolling estimate
  races: number
  plankton: number
  unlocked: string[]     // cosmetic ids
}
Update wpm after every finished practice or race:

new = old ? round(old * 0.6 + raceWpm * 0.4) : raceWpm

Setup (all modes)
Fields:

Name (2–16 chars, sanitized)
Time: 15 | 30 | 60
Level: easy | medium | hard
Style: 6 SVG/3D skins (same ids)
Color: 8 swatches

Easy: short common words

Medium: short + longer

Hard: longer + , . ' - ? !
Passage: one string generated from those lists. Same string for every racer in a room.

Practice

No PartyKit.
Local countdown optional (3-2-1).
Local score.
Award plankton: finish = 1.
Result + share card still work (mode = practice).

Friend rooms

Code: adjective-noun-xx or nanoid 6, URL /r/[code]
Host creates room with settings locked (time + level).
Joiners only pick name/style/color.
Lobby shows seahorses. Host starts when ≥2 (allow 1 for testing; production min 2).
Cap 6 players.
No AI unless host toggle Fill empty slot (default off).

Stranger matchmaking
Queue key: ${level}:${time} plus WPM band.
Bands

Saved WPMMatch bandnone (first visit)any, wait only 3–5s, then AI mid-fast<3015–4030–4925–6050–6935–8070–8955–10090+75+
Flow:

Connect to matchmaker.
Look for human same queue + band.
Wait 8–12s (first visit 3–5s).
Else create race room, sit 1 AI in band, start.
Prefer 1v1 first. If a second human arrives before lock, 3-player max for v1 is OK; lock at start.

First visit AI WPM

Easy 40–55
Medium 45–65
Hard 40–60

AI “strangers”
lib/ai/pool.ts: 60+ entries { id, name, style, color, homeWpm }.
lib/ai/typer.ts on the server (PartyKit room):

Target WPM = homeWpm * (0.92–1.08)
Emit chars with jitter
~4–10% typos + backspace on medium/hard
Pause 80–200ms on punctuation
Never snap progress to 100%

Broadcast AI like a normal player (type: "progress").

Do not label BOT on the result board.

Do not run idle AIs as fake “300 online” counters that are obviously fake. Soft presence: “Racers in the kelp” without a precise lie if you cannot back it.

Race protocol (PartyKit)
Room state:

settings, passage, status: lobby | countdown | racing | results
players: { id, name, style, color, isAi, progress, typed, errors }
startedAt, endsAt

Events (typed in lib/party/events.ts):

join start key (or batched typed) progress finish state results

Rules:

Passage chosen once in the room when countdown starts.
Clock is server startedAt.
Client may show optimistic caret; official WPM/accuracy computed in room on finish/timeout.
wpm = (correctChars / 5) / minutes
accuracy = correctChars / max(1, totalChars)
Kick / ignore messages that are too fast to be human (rate limit keys).
When time ends, freeze inputs, broadcast one results payload to all.

Plankton:

1st: 3 · 2nd: 2 · finished: 1 · accuracy ≥ 97%: +1

Apply plankton on the client after verified results (no economy server needed for v1).

Security

Sanitize names: strip tags, limit charset [A-Za-z0-9 _.-], max 16.
Treat all names as text, never dangerouslySetInnerHTML.
Validate room codes.
Max message size; debounce typing events (e.g. 50ms batches).
Origin check on PartyKit if possible.
Rate-limit room create (IP) to stop lobby spam.
No eval, no user HTML in OG image (pass only short params).
CSP in next.config (default + PartyKit + Stripe).
Env only: NEXT_PUBLIC_PARTYKIT_HOST, NEXT_PUBLIC_STRIPE_LINK, NEXT_PUBLIC_SITE_URL.
Don’t put secrets in the client.

UI / UX (premium)
Look

Dark: #070b10 abyss, teal/amber light on foam.
Light: warm paper #f3efe6, ink #141820, coral accent.
Fonts: distinctive display for titles (e.g. Fraunces or similar), IBM Plex Mono or Geist Mono for the passage.
Lots of air. Big type. Few buttons.

Motion
Landing (3D allowed)

R3F canvas: one seahorse, slow idle, caustic light, parallax. Pause canvas when tab hidden. Preload small GLB or a stylized Three mesh (keep file tiny). If GLB is heavy, use a refined SVG + CSS 3D tilt instead — beauty first, not polygon count.
Lobby

Seahorses drift in. Soft stagger. Settings morph, don’t jump.
Race (no 3D)

Full-width passage, large mono, dimmed upcoming words
Current word highlighted
Caret pulse
Lane under the text: SVG seahorses translateX by progress %
Particles only at finish (CSS/Motion), not per keystroke

Results

Winner’s 3D/SVG seahorse, numbers count up, then share bar.
Reduce motion: prefers-reduced-motion → no 3D canvas, instant fades.
Pages
Home

Wordmark lost seahorse. One line: “Type. Race. Feed your seahorse.”

Three large cards: Practice · Stranger · Friends.

Theme toggle. Small Donate.
Friends

Create → copy link. Or paste/join code.
Queue

“Finding a racer in your current…” 8–12s then seamless start (no “AI joined” copy).
Results

Same board for every client.

Buttons: Race again · Practice · Invite friends · Share on X · Donate.

Share on X
app/api/og/route.tsx using @vercel/og.
Query: name wpm acc mode place theme style color

Image 1200×630: seahorse, big WPM, place, lostseahorse.com.
Tweet:
text{wpm} WPM · {place} in a {mode} race on lostseahorse.com
Intent: https://x.com/intent/tweet?text=...&url=...

Also navigator.share when available.

Donate
Header + results: Support → Stripe Payment Link.

Copy: “Buy the lost ones some shrimp.”

Cosmetics unlocked in localStorage after a manual “I donated” is not required for v1 — link out is enough. Optional later: success URL /?shrimp=1 unlocks a hat in storage.

Scalability

Practice = static + CDN.
One PartyKit process per room.
Matchmaker is one party; keep it stateless-ish (queues in memory OK for v1; document that restart drops waiting players — they requeue).
AI exists only inside a live room.
Cap room 6, passage length bounded by time (e.g. 60s hard ≤ ~400 chars generated).

Build order (do this sequence)

Scaffold Next.js + Tailwind + themes + layout + fonts.
storage, words, generatePassage, wpm, SetupForm.
Practice page + TypingPane + ResultBoard (no network).
Ocean background + SVG seahorses + Motion.
OG route + Share on X.
Homepage 3D hero (lazy canvas) + three doors.
PartyKit race-room: friends lobby, countdown, synced passage, results.
/r/[code] wired to PartyKit.
Matchmaker + AI pool + bands + stranger page.
Donate link, polish, reduced-motion, CSP, sanitize, rate limits.
Perf pass: no 3D during typing, hide canvas offscreen, batch key events.

Acceptance checks

Open site → theme works, no white flash.
Practice starts in one click after setup; works offline after load.
Friend link: two browsers, same text, same ranking.
Stranger with nobody online: race starts with an opponent under ~12s.
First-time user not stuck in queue.
Changing client-reported WPM cannot change official place.
Name  renders as plain text.
Typing stays smooth on a laptop and a mid phone.
Win → OG image loads → X intent opens.
Dark and light both look designed, not inverted.

Tone
Calm, a little lonely, expensive. Not a gamified arcade with badges everywhere. One lost seahorse. Fast type. Soft ocean.
Build that.
