# Repository Summary: Article Enhancer

> Auto-maintained by Sim Development. Last updated: 2026-07-23T15:14:45.165Z.

## Overview

Single-page Next.js app that submits an article to an SEO enhancement pipeline and renders live streaming results (gap analysis, recommendations, enhanced draft, coverage verification) with staged panels, a progress checklist, and a status chip.

**Repository:** `article-enhancer-ui-v2`  
**File count:** 29

## Features

- Live token-by-token markdown rendering of the enhanced article
- Per-stage progress checklist driven by stream blockId events
- Staged reveal of Gap Analysis, Recommendations, Enhanced Article, and Coverage cards
- Heartbeat/status events routed to a pulsing status chip with elapsed timer
- Optimistic UI with Cancel (AbortController) and Retry on error
- Server-side streaming proxy that keeps the API key out of the client bundle

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Infrastructure

- **Neon project ID:** `mute-frost-19954257` — managed by Sim Development; do not delete or replace
- **DATABASE_URL:** set on Vercel when Neon is connected — do not commit real credentials

## Routes & Pages

- `/` — `app/page.tsx`

## Database Models

- `AppSetting`

## File Inventory

### App pages

- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`

### API routes

- `app/api/enhance/route.ts`

### Components

- `components/ArticleForm.tsx`
- `components/CoverageCard.tsx`
- `components/EnhancedArticleCard.tsx`
- `components/EnhancerClient.tsx`
- `components/ErrorCard.tsx`
- `components/GapAnalysisCard.tsx`
- `components/ProgressChecklist.tsx`
- `components/RecommendationsCard.tsx`
- `components/StatusChip.tsx`

### Libraries

- `lib/prisma.ts`
- `lib/stream.ts`
- `lib/types.ts`
- `prisma/schema.prisma`

### Config

- `.env.example`
- `.gitignore`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`

### Other

- `README.md`
- `REPO_SUMMARY.md`

## Complete File Index

- `.env.example`
- `.gitignore`
- `README.md`
- `REPO_SUMMARY.md`
- `app/api/enhance/route.ts`
- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `components/ArticleForm.tsx`
- `components/CoverageCard.tsx`
- `components/EnhancedArticleCard.tsx`
- `components/EnhancerClient.tsx`
- `components/ErrorCard.tsx`
- `components/GapAnalysisCard.tsx`
- `components/ProgressChecklist.tsx`
- `components/RecommendationsCard.tsx`
- `components/StatusChip.tsx`
- `lib/prisma.ts`
- `lib/stream.ts`
- `lib/types.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `prisma/schema.prisma`
- `tailwind.config.ts`
- `tsconfig.json`

## Latest Change

- **Updated at:** 2026-07-23T15:14:45.165Z
- **Request:** Generate a production-quality Next.js (App Router, TypeScript) single-page web app called "Article Enhancer" that submits an article to an SEO enhancement pipeline and renders the LIVE streaming results with a polished, interactive UX. Implement ALL of the following exactly.

=== SERVER ROUTE: app/api/enhance/route.ts ===
Hardcode the API key SERVER-SIDE ONLY (never expose it in the client bundle or any NEXT_PUBLIC var):
  const SIM_API_KEY = 'sk-sim-jYKjvV7VAToCX_MNfI00-2sGNmcyDZAS';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
Accept POST { article_url, article_text, content_type } from the client. Proxy to:
  POST https://test-agent.thearena.ai/api/workflows/9aafe5d7-1d24-477a-ad3f-0be9bf79c04f/execute
  Headers: { 'X-API-Key': SIM_API_KEY, 'Content-Type': 'application/json' }
  Body (JSON): {
    article_url, article_text, content_type,
    stream: true,
    selectedOutputs: [
      'recommendations.recommendations',
      'enhancedarticlewriter.content',
      'coverageverifier.criteria',
      'coverageverifier.overall_score',
      'coverageverifier.passed',
      'coverageverifier.summary',
      'gapanalysis.competitor_strengths',
      'gapanalysis.coverage_gaps',
      'gapanalysis.underdeveloped_sections'
    ]
  }
The route MUST stream: return new Response(upstream.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' } }). Pipe the upstream ReadableStream body straight through — DO NOT call upstream.json() or buffer the whole body. If upstream returns application/json (non-streamed fallback), forward it as JSON instead. Handle upstream !ok by forwarding status + error text.

=== CRITICAL: THE STREAM WIRE FORMAT (this is the part the old app got wrong) ===
The upstream emits Server-Sent Events. Each event line looks like:
  data: {"blockId":"<uuid>","chunk":"<partial text tokens>"}
The stream TERMINATES with a sentinel line:
  data: [DONE]
There are NO named-output keys like 'enhancedarticlewriter.content' in the stream — routing is BY blockId. The client MUST accumulate the 'chunk' strings per blockId (concatenate in arrival order), and map each blockId to its panel/stage using this EXACT map:
  '65f7256c' prefix => Theme Extractor  (internal; STATUS chip only, do NOT render into a panel)
  '648b01f8' prefix => Competitor Research (Exa) (internal; STATUS chip only)
  '0f239b6f' prefix => GAP ANALYSIS panel (parse accumulated text as JSON when possible: competitor_strengths[], coverage_gaps[], underdeveloped_sections[])
  '5ae6657d' prefix => RECOMMENDATIONS panel (recommendations list, prioritized/ordered)
  '88db1a98' prefix => ENHANCED ARTICLE panel (live-typed markdown content)
  'c4bd5114' prefix => COVERAGE VERIFICATION panel (overall_score, passed, summary, criteria[])
Match by blockId.startsWith(prefix) so full UUIDs still map correctly. Keep a fallback: any unknown blockId whose accumulated chunk is long-form prose is treated as the enhanced article; short JSON-ish blobs route by detected keys.

=== CLIENT: consuming the stream (app/page.tsx + components) ===
The form calls ONLY the local /api/enhance route (never the upstream directly). Use fetch + response.body.getReader() + TextDecoder to read incrementally. Buffer bytes and split on newlines — chunks WILL arrive split mid-line, so keep a leftover buffer until you hit a newline. For each complete line:
  1. Trim; if it does not start with 'data:' skip it.
  2. Take payload = line.slice(5).trim().
  3. If payload === '[DONE]' => mark the run complete, finalize all stages to done, and STOP. NEVER render '[DONE]' into any panel or the content — that was the previous bug.
  4. Otherwise JSON.parse(payload) inside try/catch (swallow parse errors on partial/non-JSON lines). On success you get { blockId, chunk }. Append chunk to that blockId's accumulator, mark that stage in-progress on first chunk and route the accumulated text to the mapped panel, re-rendering on each chunk.
Also decode raw unicode escapes (e.g. \u2013, \u2019) into real characters everywhere before display, whether values arrive as valid JSON or double-escaped plain text.

Apply ALL FIVE UX behaviors:

1) LIVE TOKEN RENDERING — as Enhanced Article Writer (blockId 88db1a98) chunks arrive, append them progressively into the Enhanced Article card so the article visibly types out in real time. Render as Markdown and re-render on each chunk. No waiting for the full payload.

2) PER-STAGE PROGRESS CHECKLIST — a vertical checklist mapped from block events:
   - Analyzing gaps (gapanalysis / 0f239b6f)
   - Generating recommendations (recommendations / 5ae6657d)
   - Writing enhanced draft (enhancedarticlewriter / 88db1a98)
   - Verifying coverage (coverageverifier / c4bd5114)
   Each item shows pending (dim), in-progress (animated spinner/pulse), done (checkmark). A stage flips to in-progress on its first chunk and to done when the next stage begins or on [DONE]. (Theme Extractor + Competitor Research feed the status chip, not the checklist.)

3) STAGED REVEAL OF PANELS — render each result section in its own card the MOMENT its data arrives, not at the end. Cards animate in (fade/slide) as they populate:
   - Gap Analysis card (competitor_strengths, coverage_gaps, underdeveloped_sections as lists)
   - Recommendations card (ordered/prioritized list)
   - Enhanced Article card (the live-typed markdown from #1)
   - Coverage Verification card (overall_score as a score badge/gauge, passed as a pass/fail pill, summary text, criteria list)

4) HEARTBEAT/STATUS EVENTS TO A STATUS CHIP, NOT CONTENT — detect heartbeat/progress/status/keepalive events and messages like 'This usually takes 1-2 minutes - 15s elapsed' and route them to a subtle live status chip with a pulsing dot showing current activity + a live elapsed-time counter that ticks every second on the client. NEVER render these (or [DONE]) into the article content or any result card.

5) OPTIMISTIC UI — on Enhance click: immediately disable the button, switch it to a loading state, start the elapsed-time chip and the progress checklist right away (before the first byte), and clear/reset previous results. Provide a Cancel button that aborts the fetch via AbortController and restores idle state. On error, show an on-brand error card with a Retry action that re-submits the same inputs.

=== INPUTS / VALIDATION ===
Three inputs with client-side inline validation:
  - Article URL (required, valid-URL check)
  - Article Text (required, non-empty)
  - Content Type (required select: Blog Post / Landing Page / Guide / News / Product Page + an Other free-text option)

=== LAYOUT / THEME ===
No header/nav/footer. Centered single-page max-width container. Considered palette: off-white background, ink-navy text, indigo/violet accent. Fonts: Space Grotesk (headings) + Inter (body). Animated gradient/progress line on the result area while streaming. Fully responsive, rounded corners, subtle shadows, visible focus states, respects prefers-reduced-motion. Clean, typed, production-quality React/TypeScript with proper component structure and an error boundary.

=== NON-GOALS ===
No database/persistence needed — this app is stateless (do not require Neon/Prisma). No auth.
