// ─────────────────────────────────────────────────────────────
// ChatView — Main chat area integrating header, messages, input
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatStatsBar } from './ChatStatsBar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { PermissionModal } from './PermissionModal';
import { useChatStore } from '../../stores/chat-store';
import { useChat } from '../../hooks/useChat';
import { useProviderStore } from '../../stores/provider-store';
import { useUIStore } from '../../stores/ui-store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Sparkles, Code, Lightbulb, Zap, ArrowRight, Settings, Bot } from 'lucide-react';

export function ChatView() {
  const activeConversationId = useChatStore(s => s.activeConversationId);
  const {
    sendMessage, stopGeneration, regenerateLastMessage, isGenerating,
    pendingPermission, handlePermissionAllow, handlePermissionAllowAll, handlePermissionDeny,
  } = useChat();
  const getConfiguredProviders = useProviderStore(s => s.getConfiguredProviders);
  const configuredProviders = getConfiguredProviders();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const rawMessages = useChatStore(s => s.messages);
  const messages = rawMessages.filter(m => m.role !== 'system' && m.role !== 'tool');

  // Virtualizer for messages
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 100, // Approximate initial height of a message
    overscan: 5,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isScrolledToBottomRef.current) {
      // If virtualized, we scroll to the last index
      if (messages.length > 0) {
        rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      }
    }
  }, [messages.length, messages[messages.length - 1]?.content.length, rowVirtualizer]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Check if we're within 50px of the bottom
    isScrolledToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  const hasConfiguredProviders = configuredProviders.length > 0;

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      window.dispatchEvent(new CustomEvent('aiside-file-drop', { detail: { files } }));
    }
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--accent)',
          borderRadius: 'var(--radius-lg)',
          margin: '16px',
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '32px 48px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ color: 'var(--accent)', background: 'var(--accent-subtle)', padding: 16, borderRadius: '50%' }}>
              <ArrowRight size={32} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Drop files here</h2>
            <p style={{ color: 'var(--text-muted)' }}>Images and PDFs will be attached to your message.</p>
          </div>
        </div>
      )}
      <ChatHeader />
      <ChatStatsBar />

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          scrollBehavior: 'auto', // Changed to auto to prevent jerky virtual scrolling
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 16px',
        }}>
          {messages.length === 0 ? (
            <EmptyChatState 
              hasConfiguredProviders={hasConfiguredProviders} 
              onSend={sendMessage} 
            />
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const msg = messages[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: 16, // gap replacement
                    }}
                  >
                    <MessageBubble
                      message={msg}
                      isLast={virtualRow.index === messages.length - 1}
                      onRegenerate={regenerateLastMessage}
                      onDelete={(id) => useChatStore.getState().deleteMessage(id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <MessageInput 
          onSend={sendMessage}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          disabled={!hasConfiguredProviders}
        />
      </div>

      {/* Permission Modal for browser actions */}
      {pendingPermission && (
        <PermissionModal
          action={pendingPermission.action}
          target={pendingPermission.target}
          value={pendingPermission.value}
          onAllow={handlePermissionAllow}
          onAllowAll={handlePermissionAllowAll}
          onDeny={handlePermissionDeny}
        />
      )}
    </div>
  );
}

// ── Empty State Component ───────────────────────────────────

function EmptyChatState({ hasConfiguredProviders, onSend }: { hasConfiguredProviders: boolean, onSend: (text: string) => void }) {
  const setView = useUIStore(s => s.setView);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const starters = [
    { icon: <Sparkles size={18} />, label: 'Explain a complex topic', text: 'Explain quantum entanglement simply' },
    { icon: <Code size={18} />, label: 'Help me debug code', text: 'How do I debug a memory leak in Node.js?' },
    { icon: <Lightbulb size={18} />, label: 'Brainstorm ideas', text: 'Give me 5 unique project ideas for a hackathon' },
    { icon: <Zap size={18} />, label: 'Summarize text', text: 'Summarize the key points of the latest AI advancements' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 'calc(100vh - 200px)',
      color: 'var(--text-muted)',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        position: 'relative',
        width: 80,
        height: 80,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          inset: -10,
          background: 'linear-gradient(135deg, var(--accent), var(--success))',
          borderRadius: '50%',
          opacity: 0.15,
          filter: 'blur(20px)',
          animation: 'pulse 3s infinite alternate'
        }} />
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'relative',
          zIndex: 1,
        }}>
          <Bot size={36} color="var(--accent)" strokeWidth={1.5} style={{ opacity: 0.9 }} />
        </div>
      </div>
      
      <h2 style={{ 
        fontSize: '1.75rem', 
        color: 'var(--text-primary)', 
        marginBottom: 12, 
        fontWeight: 600,
        letterSpacing: '-0.02em'
      }}>
        {hasConfiguredProviders ? 'How can I help you today?' : 'Welcome to AISiDE'}
      </h2>
      
      <p style={{ 
        maxWidth: 460, 
        fontSize: '1rem', 
        lineHeight: 1.6, 
        color: 'var(--text-secondary)',
        marginBottom: 40 
      }}>
        {hasConfiguredProviders 
          ? 'Select a model and start chatting, or pick a starter below.'
          : 'To get started, you need to connect an AI provider.'}
      </p>

      {hasConfiguredProviders ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          width: '100%',
          maxWidth: 600,
        }}>
          {starters.map((starter, i) => (
            <button
              key={i}
              onClick={() => onSend(starter.text)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '16px 20px',
                background: hoveredIndex === i ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderColor: hoveredIndex === i ? 'var(--border-focus)' : 'var(--border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                color: hoveredIndex === i ? 'var(--accent)' : 'var(--text-primary)',
                marginBottom: 8,
                fontWeight: 500,
                transition: 'color var(--transition-fast)',
              }}>
                {starter.icon}
                <span>{starter.label}</span>
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {starter.text}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setView('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity var(--transition-fast)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Settings size={18} />
          Go to Settings
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}
