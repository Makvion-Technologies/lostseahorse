<div align="center">

<h1 align="center">
  <img src=".github/assets/readme-logo.png" alt="" height="48" />
  lost seahorse
</h1>

**A calm, no-login typing game. Practice solo or race strangers and friends in real time.**

[lostseahorse.com](https://lostseahorse.com)

</div>

## About

lost seahorse is a premium typing experience with no accounts and no signup. Play solo to sharpen your speed, match a stranger for a live race, or open a private room and invite friends. Progress and cosmetics stay on the device; race results are decided on the server.

## Features

- **Solo practice** — instant typing runs with no server required
- **Race a stranger** — matchmaking by WPM band, with AI racers that fill the lobby when needed
- **Race friends** — create or join a room with a code or invite link (`/r/[code]`)
- **Race settings** — easy / medium / hard passages, optional punctuation and numbers, timed runs
- **Strangers leaderboard** — standings for timed stranger races
- **Light and dark themes** — system-safe theming with no flash on load
- **Optional donate** — Stripe Payment Link when `NEXT_PUBLIC_STRIPE_LINK` is set

## Tech stack

| Layer | Stack |
| --- | --- |
| Web app | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Motion / 3D (lobby & results) | Motion, Three.js via React Three Fiber |
| Realtime | PartyServer on Cloudflare Durable Objects (`wrangler`) |
| Analytics | Vercel Analytics |
| Payments | Stripe Payment Link (client-side link only) |

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_PARTYKIT_HOST` | Host of the realtime PartyServer (default `127.0.0.1:1999` for local) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for metadata and links |
| `NEXT_PUBLIC_STRIPE_LINK` | Optional Stripe Payment Link for donate |

### Develop

Run the Next.js app and the realtime worker in two terminals:

```bash
npm run dev      # Next.js at http://localhost:3000
npm run party    # PartyServer (Wrangler) at http://127.0.0.1:1999
```

Other scripts:

```bash
npm run build         # production build of the web app
npm run start         # serve the production build
npm run lint          # ESLint
npm run party:check   # typecheck the party worker
npm run party:deploy  # deploy the PartyServer to Cloudflare
```

## Project structure

```
app/           Next.js App Router pages and API routes
components/    UI, screens, seahorse, typing, lobbies
lib/           Shared game logic, storage, WPM, party helpers
party/         Cloudflare Durable Objects (race rooms, matchmaker, profiles)
public/        Static assets
wrangler.jsonc PartyServer / Durable Objects config
```

## Deployment

- **Web app** — deploy the Next.js project to [Vercel](https://vercel.com). Set the same `NEXT_PUBLIC_*` variables in the project settings.
- **Realtime** — deploy the PartyServer with `npm run party:deploy` (Cloudflare Workers + Durable Objects via Wrangler). Point `NEXT_PUBLIC_PARTYKIT_HOST` at the deployed worker host.

## Contributing

Internal contributions follow the Makvion Technologies guide:

[CONTRIBUTING.md](https://github.com/Makvion-Technologies/.github/blob/main/CONTRIBUTING.md)

## License

© Makvion Technologies LLP. All rights reserved.
