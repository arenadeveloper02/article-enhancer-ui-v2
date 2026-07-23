import type { ReactNode } from 'react'

interface MarkdownRendererProps {
  content: string
}

const INLINE_SOURCE =
  '(\\*\\*[^*]+\\*\\*)|(`[^`]+`)|(\\[[^\\]]+\\]\\([^)]+\\))|(==[^=]+==)|(<mark>[\\s\\S]*?<\\/mark>)|(\\*[^*\\s][^*]*\\*)'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = new RegExp(INLINE_SOURCE, 'g')
  let last = 0
  let index = 0
  let match = regex.exec(text)
  while (match !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${index}`
    index += 1
    if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (link) {
        nodes.push(
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        )
      } else {
        nodes.push(token)
      }
    } else if (token.startsWith('==')) {
      nodes.push(<mark key={key}>{token.slice(2, -2)}</mark>)
    } else if (token.startsWith('<mark>')) {
      nodes.push(<mark key={key}>{token.slice(6, -7)}</mark>)
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
    match = regex.exec(text)
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function isStructural(line: string): boolean {
  const t = line.trim()
  return (
    /^#{1,4}\s/.test(t) ||
    /^[-*]\s/.test(t) ||
    /^\d+[.)]\s/.test(t) ||
    t.startsWith('>') ||
    t.startsWith('```') ||
    /^(-{3,}|\*{3,})$/.test(t)
  )
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') {
      i += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i += 1
      }
      i += 1
      const k = blockKey
      blockKey += 1
      blocks.push(
        <pre key={k}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed)
    if (heading) {
      const level = heading[1].length
      const k = blockKey
      blockKey += 1
      const inner = renderInline(heading[2], `h-${k}`)
      if (level === 1) blocks.push(<h1 key={k}>{inner}</h1>)
      else if (level === 2) blocks.push(<h2 key={k}>{inner}</h2>)
      else if (level === 3) blocks.push(<h3 key={k}>{inner}</h3>)
      else blocks.push(<h4 key={k}>{inner}</h4>)
      i += 1
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      const k = blockKey
      blockKey += 1
      blocks.push(<hr key={k} />)
      i += 1
      continue
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      const k = blockKey
      blockKey += 1
      blocks.push(<blockquote key={k}>{renderInline(quote.join(' '), `q-${k}`)}</blockquote>)
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      const k = blockKey
      blockKey += 1
      blocks.push(
        <ul key={k}>
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ul-${k}-${idx}`)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''))
        i += 1
      }
      const k = blockKey
      blockKey += 1
      blocks.push(
        <ol key={k}>
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ol-${k}-${idx}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    const para: string[] = [trimmed]
    i += 1
    while (i < lines.length && lines[i].trim() !== '' && !isStructural(lines[i])) {
      para.push(lines[i].trim())
      i += 1
    }
    const k = blockKey
    blockKey += 1
    blocks.push(<p key={k}>{renderInline(para.join(' '), `p-${k}`)}</p>)
  }

  return <div>{blocks}</div>
}
