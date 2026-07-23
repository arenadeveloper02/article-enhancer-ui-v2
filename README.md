# Article Enhancer

A single-page Next.js (App Router, TypeScript) app that submits an article to an SEO enhancement pipeline and renders the LIVE streaming results — gap analysis, prioritized recommendations, a live-typed enhanced draft, and coverage verification.

## Features

- **Streaming proxy** — `app/api/enhance/route.ts` holds the API key server-side only and pipes the upstream SSE stream straight through without buffering
- **Per-blockId routing** — SSE `data: {"blockId","chunk"}` events are accumulated per block and routed to the correct panel by blockId prefix; `data: [DONE]` terminates the run and is never rendered
- **Live token rendering** — the enhanced article types out in real time as markdown
- **Per-stage progress checklist** — pending / in-progress / done states driven by block events
- **Staged panel reveal** — each result card animates in the moment its data arrives
- **Status chip** — heartbeats and internal stages (Theme Extractor, Competitor Research) feed a pulsing status chip with a live elapsed-time counter
- **Optimistic UI** — instant loading state, Cancel via AbortController, on-brand error card with Retry

## Tech stack

- Next.js ^15.3.3 (App Router) + React ^19
- TypeScript (strict)
- Tailwind CSS v3
- react-markdown
- Fonts: Space Grotesk (headings) + Inter (body) via `next/font`

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are required — the pipeline API key is hardcoded server-side in `app/api/enhance/route.ts` and never exposed to the client bundle.

## Build

```bash
npm run build
npm start
```

## Deploy

Deploys to Vercel with zero configuration. The app is stateless — no database or persistence is required.
