import ReactMarkdown from 'react-markdown';

interface EnhancedArticleCardProps {
  content: string;
  streaming: boolean;
}

export default function EnhancedArticleCard({ content, streaming }: EnhancedArticleCardProps) {
  return (
    <article className="result-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="card-title">Enhanced Article</h2>
        {streaming && (
          <span className="animate-pulse text-xs font-semibold text-accent-deep">Writing live…</span>
        )}
      </div>
      <div className="prose-article mt-4">
        <ReactMarkdown>{content}</ReactMarkdown>
        {streaming && <span className="typing-cursor" aria-hidden="true" />}
      </div>
    </article>
  );
}
