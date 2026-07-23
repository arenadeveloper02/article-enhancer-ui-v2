"use client"

import { useState } from 'react'
import { Check, Copy, FileText } from 'lucide-react'
import type { SectionStatus } from '@/lib/types'
import SectionCard, { SkeletonLines } from '@/components/SectionCard'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface EnhancedArticleSectionProps {
  content: string
  status: SectionStatus
}

export default function EnhancedArticleSection({ content, status }: EnhancedArticleSectionProps) {
  const [copied, setCopied] = useState(false)
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <SectionCard title="Enhanced Article" icon={<FileText className="h-5 w-5 text-indigo-600" />} status={status} accent>
      {content.trim() ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-indigo-700">
              {wordCount.toLocaleString()} words
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy article'}
            </button>
          </div>
          <div className="article-body text-slate-800">
            <MarkdownRenderer content={content} />
            {status === 'streaming' && <span className="typing-caret" aria-hidden="true" />}
          </div>
        </div>
      ) : status === 'pending' || status === 'streaming' ? (
        <SkeletonLines lines={6} />
      ) : (
        <p className="text-sm text-slate-500">No data returned for this section.</p>
      )}
    </SectionCard>
  )
}
