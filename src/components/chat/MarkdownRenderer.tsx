// ─────────────────────────────────────────────────────────────
// MarkdownRenderer — Renders markdown with code highlighting
// ─────────────────────────────────────────────────────────────

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content${isStreaming ? ' streaming-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            // Detect if this is a fenced code block (has language or is multiline)
            const isBlock = match || codeString.includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  code={codeString}
                  language={match?.[1]}
                />
              );
            }

            // Inline code
            return (
              <code className={className} {...(props as any)}>
                {children}
              </code>
            );
          },
          // Open links in new tab
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
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
