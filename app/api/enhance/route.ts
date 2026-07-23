import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIM_API_KEY = 'sk-sim-jYKjvV7VAToCX_MNfI00-2sGNmcyDZAS';
const UPSTREAM_URL =
  'https://test-agent.thearena.ai/api/workflows/9aafe5d7-1d24-477a-ad3f-0be9bf79c04f/execute';

const SELECTED_OUTPUTS = [
  'recommendations.recommendations',
  'enhancedarticlewriter.content',
  'coverageverifier.criteria',
  'coverageverifier.overall_score',
  'coverageverifier.passed',
  'coverageverifier.summary',
  'gapanalysis.competitor_strengths',
  'gapanalysis.coverage_gaps',
  'gapanalysis.underdeveloped_sections',
];

interface EnhanceRequestPayload {
  article_url?: unknown;
  article_text?: unknown;
  content_type?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let payload: EnhanceRequestPayload;
  try {
    payload = (await request.json()) as EnhanceRequestPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const articleUrl = typeof payload.article_url === 'string' ? payload.article_url.trim() : '';
  const articleText = typeof payload.article_text === 'string' ? payload.article_text.trim() : '';
  const contentType = typeof payload.content_type === 'string' ? payload.content_type.trim() : '';

  if (!articleUrl || !articleText || !contentType) {
    return NextResponse.json(
      { error: 'article_url, article_text and content_type are all required.' },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': SIM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article_url: articleUrl,
        article_text: articleText,
        content_type: contentType,
        stream: true,
        selectedOutputs: SELECTED_OUTPUTS,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach the enhancement service. Please try again.' },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const errorText = await upstream.text();
    return new Response(errorText || `Upstream error (${upstream.status})`, {
      status: upstream.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const upstreamContentType = upstream.headers.get('content-type') ?? '';
  if (upstreamContentType.includes('application/json')) {
    // Non-streamed fallback: forward the JSON as-is.
    const jsonText = await upstream.text();
    return new Response(jsonText, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  if (!upstream.body) {
    return NextResponse.json({ error: 'Upstream returned no stream body.' }, { status: 502 });
  }

  // Pipe the upstream stream straight through — never buffer the whole body.
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
