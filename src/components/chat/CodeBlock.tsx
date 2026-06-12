// ─────────────────────────────────────────────────────────────
// CodeBlock — Syntax-highlighted code with copy button
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import { Check, Copy, ChevronDown, ChevronRight, Play, Code } from 'lucide-react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArtifactPreview } from './ArtifactPreview';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const displayLang = language || 'text';
  const lineCount = code.split('\n').length;
  
  const isPreviewable = ['html', 'css', 'javascript', 'js', 'jsx', 'tsx', 'react'].includes(displayLang.toLowerCase());

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--code-border)',
      overflow: 'hidden',
      margin: '12px 0',
      background: 'var(--code-bg)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--code-border)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {lineCount > 10 && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
            {filename || displayLang}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {lineCount} lines
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPreviewable && (
            <button
              onClick={() => setIsPreview(!isPreview)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: isPreview ? 'var(--accent-subtle)' : 'transparent',
                border: 'none',
                color: isPreview ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-fast)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!isPreview) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isPreview) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {isPreview ? <Code size={13} /> : <Play size={13} />}
              {isPreview ? 'Code' : 'Preview'}
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              if (!copied) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!copied) e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code Content */}
      {!collapsed && !isPreview && (
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '12px 16px',
            border: 'none',
            borderRadius: 0,
            fontSize: '0.85rem',
            lineHeight: 1.6,
            background: 'transparent',
            maxHeight: '500px',
            overflow: 'auto',
          }}
        >
          {code}
        </SyntaxHighlighter>
      )}

      {/* Artifact Preview */}
      {!collapsed && isPreview && (
        <ArtifactPreview code={code} language={displayLang} />
      )}
    </div>
  );
}
