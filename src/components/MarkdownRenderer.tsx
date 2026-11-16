import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const rawCode = String(children).replace(/\n$/, '');
  const langMatch = /language-([\w-]+)/.exec(className || '');
  const language = langMatch?.[1] || '';

  const highlightedHtml = useMemo(() => {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(rawCode, { language }).value;
      }
      return hljs.highlightAuto(rawCode).value;
    } catch {
      return '';
    }
  }, [rawCode, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-300/60 bg-slate-900/5 dark:border-white/15 dark:bg-slate-950/65">
      <div className="flex items-center justify-between border-b border-slate-300/50 px-3.5 py-2 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
        <span className="font-mono font-medium">{language || 'código'}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar bloque de código"
          className="inline-flex min-h-[28px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-900/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="liquid-scroll overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed">
        {highlightedHtml ? (
          <code
            className={`hljs ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className={className}>{rawCode}</code>
        )}
      </pre>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(
  ({ content }) => {
    return (
      <div className="liquid-prose text-[15px] text-slate-800 dark:text-slate-100">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ className, children, ...props }) {
              const isBlock =
                Boolean(className) || String(children).includes('\n');
              if (isBlock) {
                return <CodeBlock className={className}>{children}</CodeBlock>;
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            a({ href, children, ...props }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-500 dark:text-sky-400"
                  {...props}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);
