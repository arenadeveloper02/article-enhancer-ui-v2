"use client"

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Sparkles, XCircle } from 'lucide-react'
import type { EnhanceInput } from '@/lib/types'

interface ArticleFormProps {
  running: boolean
  onSubmit: (input: EnhanceInput) => void
  onCancel: () => void
}

interface FieldErrors {
  url?: string
  text?: string
  type?: string
}

const CONTENT_TYPES = ['Blog Post', 'Landing Page', 'Guide', 'News', 'Product Page', 'Other'] as const

export default function ArticleForm({ running, onSubmit, onCancel }: ArticleFormProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [contentType, setContentType] = useState<string>('Blog Post')
  const [customType, setCustomType] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const validate = (): boolean => {
    const next: FieldErrors = {}
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      next.url = 'Article URL is required.'
    } else {
      try {
        const parsed = new URL(trimmedUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          next.url = 'URL must start with http:// or https://.'
        }
      } catch {
        next.url = 'Enter a valid URL, including https://.'
      }
    }
    if (!text.trim()) next.text = 'Article text is required.'
    if (contentType === 'Other' && !customType.trim()) next.type = 'Enter a custom content type.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (running) return
    if (!validate()) return
    onSubmit({
      articleUrl: url.trim(),
      articleText: text.trim(),
      contentType: contentType === 'Other' ? customType.trim() : contentType,
    })
  }

  const inputClass =
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60'

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5">
        <div>
          <label htmlFor="article-url" className="mb-1.5 block text-sm font-medium text-ink">
            Article URL <span className="text-rose-500">*</span>
          </label>
          <input
            id="article-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/my-article"
            disabled={running}
            aria-invalid={Boolean(errors.url)}
            className={`${inputClass} ${errors.url ? 'border-rose-400' : 'border-slate-200'}`}
          />
          {errors.url && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.url}</p>}
        </div>

        <div>
          <label htmlFor="article-text" className="mb-1.5 block text-sm font-medium text-ink">
            Article Text <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="article-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full article text here\u2026"
            rows={8}
            disabled={running}
            aria-invalid={Boolean(errors.text)}
            className={`${inputClass} resize-y ${errors.text ? 'border-rose-400' : 'border-slate-200'}`}
          />
          {errors.text && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.text}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="content-type" className="mb-1.5 block text-sm font-medium text-ink">
              Content Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              disabled={running}
              className={`${inputClass} border-slate-200`}
            >
              {CONTENT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {contentType === 'Other' && (
            <div>
              <label htmlFor="custom-type" className="mb-1.5 block text-sm font-medium text-ink">
                Custom Type <span className="text-rose-500">*</span>
              </label>
              <input
                id="custom-type"
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. Case Study"
                disabled={running}
                aria-invalid={Boolean(errors.type)}
                className={`${inputClass} ${errors.type ? 'border-rose-400' : 'border-slate-200'}`}
              />
              {errors.type && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.type}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? 'Enhancing\u2026' : 'Enhance article'}
          </button>
          {running && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
