export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIM_API_KEY = 'sk-sim-jYKjvV7VAToCX_MNfI00-2sGNmcyDZAS'
const WORKFLOW_URL = 'https://test-agent.thearena.ai/api/workflows/9aafe5d7-1d24-477a-ad3f-0be9bf79c04f/execute'

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
]

export async function POST(request: Request): Promise<Response> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const body = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const articleUrl = typeof body.article_url === 'string' ? body.article_url : ''
  const articleText = typeof body.article_text === 'string' ? body.article_text : ''
  const contentType = typeof body.content_type === 'string' ? body.content_type : ''

  if (!articleUrl || !articleText || !contentType) {
    return Response.json(
      { error: 'article_url, article_text and content_type are required' },
      { status: 400 }
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(WORKFLOW_URL, {
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
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reach the enhancement service'
    return Response.json({ error: message }, { status: 502 })
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(text || `Upstream error (${upstream.status})`, {
      status: upstream.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const upstreamType = upstream.headers.get('content-type') ?? ''
  if (upstreamType.includes('application/json')) {
    const json = await upstream.text()
    return new Response(json, { headers: { 'Content-Type': 'application/json' } })
  }

  if (!upstream.body) {
    return Response.json({ error: 'Upstream returned an empty body' }, { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
