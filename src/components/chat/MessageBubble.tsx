// ─────────────────────────────────────────────────────────────
// MessageBubble — Single chat message with actions
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Pencil, Trash2, AlertCircle, User, Sparkles, Brain, ChevronDown, ChevronRight, FileText, Search, Image as ImageIcon, Volume2, Square, MousePointer2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../../types/chat';
import { formatRelativeTime, formatTokenCount, formatCost, stripMarkdown } from '../../lib/utils';

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
  isLast?: boolean;
}

export function MessageBubble({
  message,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  isLast,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy?.(message.content);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const textToSpeak = stripMarkdown(message.content);
    if (!textToSpeak) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [contextExpanded, setContextExpanded] = useState(false);

  return (
    <div
      className="animate-fade-in-up"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12,
        padding: '16px 20px',
        position: 'relative',
        transition: 'background var(--transition-fast)',
        background: showActions ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 'var(--radius-md)',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isUser ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
        color: isUser ? 'var(--accent)' : 'var(--text-secondary)',
        marginTop: 2,
      }}>
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        minWidth: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isUser ? 'flex-end' : 'flex-start' 
      }}>
        {/* Role label */}
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: isUser ? 'var(--text-primary)' : 'var(--accent)',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}>
          {isUser ? 'You' : 'Assistant'}
          {isAssistant && message.modelId && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}>
              {message.modelId}
            </span>
          )}
        </div>

        {/* Error state */}
        {message.isError && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-subtle)',
            color: 'var(--error)',
            fontSize: '0.85rem',
            marginBottom: 8,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{message.errorMessage || 'An error occurred'}</span>
          </div>
        )}

        {/* Reasoning Block */}
        {message.reasoningContent && (
          <div style={{ marginBottom: 12 }}>
            <div 
              onClick={() => setReasoningExpanded(!reasoningExpanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background var(--transition-fast)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              <Brain size={13} style={{ color: 'var(--text-muted)' }} />
              Thought Process
              {reasoningExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </div>

            {reasoningExpanded && (
              <div style={{
                marginTop: 8,
                padding: '12px 16px',
                borderLeft: '2px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                opacity: message.isStreaming && !message.content ? 1 : 0.8,
              }}>
                <MarkdownRenderer 
                  content={message.reasoningContent} 
                  isStreaming={message.isStreaming && !message.content} 
                />
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            flexWrap: 'wrap', 
            marginBottom: 12,
            justifyContent: isUser ? 'flex-end' : 'flex-start'
          }}>
            {message.attachments.map((att, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                {att.type === 'image' ? (
                  <img src={att.data} alt={att.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <FileText size={16} style={{ color: 'var(--accent)' }} />
                )}
                <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div style={{
            background: isUser ? 'var(--user-bubble)' : 'transparent',
            padding: isUser ? '10px 16px' : '0',
            borderRadius: isUser ? 'var(--radius-lg)' : '0',
            borderTopRightRadius: isUser ? '4px' : undefined,
            color: 'var(--text-primary)',
            maxWidth: '100%',
            overflowX: 'auto',
            boxShadow: isUser ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            border: isUser ? '1px solid var(--border)' : 'none',
          }}>
            <MarkdownRenderer
              content={message.content}
              isStreaming={message.isStreaming}
            />
          </div>
        )}

        {/* Attached Page Context */}
        {message.pageContext && (
          <div style={{ marginTop: 12 }}>
            <div 
              onClick={() => setContextExpanded(!contextExpanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background var(--transition-fast)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
            >
              <FileText size={14} style={{ color: 'var(--accent)' }} />
              Page Context Attached: {message.pageContext.title || 'Untitled Page'}
              {contextExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {contextExpanded && (
              <div style={{
                marginTop: 8,
                padding: '12px 16px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                maxHeight: '300px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
              }}>
                <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
                  <a href={message.pageContext.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', wordBreak: 'break-all' }}>
                    {message.pageContext.url}
                  </a>
                </div>
                {message.pageContext.content}
              </div>
            )}
          </div>
        )}

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {message.toolCalls.map((call, idx) => {
              if (call.function.name === 'web_search' || call.function.name === 'tavily_search' || call.function.name === 'duckduckgo_search') {
                let query = 'Web search';
                try {
                  const args = JSON.parse(call.function.arguments);
                  if (args.query) query = `Searched web for: "${args.query}"`;
                } catch {}
                
                return (
                  <div key={call.id || idx} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    width: 'fit-content'
                  }}>
                    <Search size={14} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 500 }}>{query}</span>
                    <Check size={14} style={{ color: 'var(--success)', marginLeft: 8 }} />
                  </div>
                );
              } else if (call.function.name === 'browser_action') {
                let actionDesc = 'Interacting with page';
                try {
                  const args = JSON.parse(call.function.arguments);
                  actionDesc = `Action: ${args.action} ${args.selector ? `on ${args.selector}` : ''}`;
                } catch {}
                
                return (
                  <div key={call.id || idx} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    width: 'fit-content'
                  }}>
                    <MousePointer2 size={14} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 500 }}>{actionDesc}</span>
                    <Check size={14} style={{ color: 'var(--success)', marginLeft: 8 }} />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Streaming indicator */}
        {message.isStreaming && !message.content && (
          <div style={{
            display: 'flex',
            gap: 4,
            padding: '4px 0',
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Meta info for assistant messages */}
        {isAssistant && !message.isStreaming && message.totalTokens && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 8,
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}>
            {message.totalTokens > 0 && (
              <span>{formatTokenCount(message.totalTokens)} tokens</span>
            )}
            {message.estimatedCost != null && message.estimatedCost > 0 && (
              <span>{formatCost(message.estimatedCost)}</span>
            )}
            {message.latencyMs && (
              <span>{(message.latencyMs / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && !message.isStreaming && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'absolute',
          top: 8,
          [isUser ? 'left' : 'right']: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2px',
        }}>
          <ActionButton
            icon={copied ? <Check size={13} /> : <Copy size={13} />}
            tooltip={copied ? 'Copied' : 'Copy'}
            onClick={handleCopy}
            active={copied}
          />
          {isAssistant && (
            <ActionButton
              icon={isPlaying ? <Square size={13} /> : <Volume2 size={13} />}
              tooltip={isPlaying ? 'Stop Audio' : 'Play Audio'}
              onClick={handlePlayAudio}
              active={isPlaying}
            />
          )}
          {isUser && (
            <ActionButton
              icon={<Pencil size={13} />}
              tooltip="Edit"
              onClick={() => onEdit?.(message.id)}
            />
          )}
          {isAssistant && isLast && (
            <ActionButton
              icon={<RefreshCw size={13} />}
              tooltip="Regenerate"
              onClick={onRegenerate}
            />
          )}
          <ActionButton
            icon={<Trash2 size={13} />}
            tooltip="Delete"
            onClick={() => onDelete?.(message.id)}
            danger
          />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  tooltip,
  onClick,
  active,
  danger,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={tooltip}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        border: 'none',
        background: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        color: active
          ? 'var(--success)'
          : danger
          ? 'var(--error)'
          : 'var(--text-secondary)',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        if (!active && !danger) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
        if (!active) {
          e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-secondary)';
        }
      }}
    >
      {icon}
    </button>
  );
}
