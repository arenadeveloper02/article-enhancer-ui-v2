# Article Enhancer

A single-page Next.js (App Router, TypeScript) app that submits an article to an SEO enhancement pipeline and renders the LIVE streaming results: an enhanced article typed out token-by-token, gap analysis, prioritized recommendations, and a coverage verification scorecard.

## Features

- **Server-side streaming proxy** (`/api/enhance`) that pipes upstream SSE straight through without buffering; the workflow API key lives server-side only and never reaches the client bundle
- **Correct SSE wire-format handling**: `data: {"blockId","chunk"}` lines are accumulated per blockId, terminated by the `data: [DONE]` sentinel (never rendered into content), and routed to panels by blockId prefix
- **Four purpose-built result sections**: Enhanced Article (live Markdown typing with caret, copy button, word count), Gap Analysis (three color-coded sub-groups), Recommendations (prioritized numbered cards), Coverage Verification (circular score gauge, PASS/FAIL pill, criteria checklist)
- **Per-stage progress checklist** with pending / in-progress / done states driven by block events
- **Heartbeat and status events** routed to a pulsing status chip with a live elapsed-time counter
- **Optimistic UI**: instant loading state, cancel via `AbortController`, error card with retry
- Inline form validation, staged card reveal, `prefers-reduced-motion` support

## Tech stack

- Next.js ^15.3.3 (App Router) + React ^19
- TypeScript (strict)
- Tailwind CSS v3
- lucide-react icons
- Space Grotesk + Inter via `next/font/google`

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are required (see `.env.example`).

## Deploy

```bash
npm run build
npm start
```

Works out of the box on Vercel. The `/api/enhance` route runs on the Node.js runtime with `dynamic = 'force-dynamic'` so responses stream without buffering.
