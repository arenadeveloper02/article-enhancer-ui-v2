"use client"

import { useState } from 'react';
import type { EnhanceInput } from '@/lib/types';

interface ArticleFormProps {
  running: boolean;
  onSubmit: (input: EnhanceInput) => void;
  onCancel: () => void;
}

interface ArticleFormErrors {
  url?: string;
  text?: string;
  type?: string;
}

const CONTENT_TYPE_OPTIONS = [
  'Blog Post',
  'Landing Page',
  'Guide',
  'News',
  'Product Page',
  'Other',
] as const;

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ArticleForm({ running, onSubmit, onCancel }: ArticleFormProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [contentType, setContentType] = useState<string>('Blog Post');
  const [otherType, setOtherType] = useState('');
  const [errors, setErrors] = useState<ArticleFormErrors>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (running) return;

    const nextErrors: ArticleFormErrors = {};
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    const resolvedType = contentType === 'Other' ? otherType.trim() : contentType;

    if (!trimmedUrl) nextErrors.url = 'Article URL is required.';
    else if (!isValidUrl(trimmedUrl)) nextErrors.url = 'Enter a valid http(s) URL.';
    if (!trimmedText) nextErrors.text = 'Article text is required.';
    if (!resolvedType) nextErrors.type = 'Enter a custom content type.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({ article_url: trimmedUrl, article_text: trimmedText, content_type: resolvedType });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-10 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label htmlFor="article-url" className="field-label">
          Article URL
        </label>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/my-article"
          className="field-input"
          disabled={running}
          aria-invalid={Boolean(errors.url)}
        />
        {errors.url && <p className="field-error">{errors.url}</p>}
      </div>

      <div>
        <label htmlFor="article-text" className="field-label">
          Article Text
        </label>
        <textarea
          id="article-text"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full article text here…"
          className="field-input resize-y"
          disabled={running}
          aria-invalid={Boolean(errors.text)}
        />
        {errors.text && <p className="field-error">{errors.text}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="content-type" className="field-label">
            Content Type
          </label>
          <select
            id="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="field-input"
            disabled={running}
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {contentType === 'Other' && (
          <div>
            <label htmlFor="other-type" className="field-label">
              Custom content type
            </label>
            <input
              id="other-type"
              type="text"
              value={otherType}
              onChange={(e) => setOtherType(e.target.value)}
              placeholder="e.g. Case Study"
              className="field-input"
              disabled={running}
              aria-invalid={Boolean(errors.type)}
            />
          </div>
        )}
      </div>
      {errors.type && <p className="field-error">{errors.type}</p>}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Enhancing…
            </>
          ) : (
            'Enhance article'
          )}
        </button>
        {running && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
