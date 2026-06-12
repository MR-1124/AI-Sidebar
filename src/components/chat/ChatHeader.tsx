// ─────────────────────────────────────────────────────────────
// ChatHeader — Top bar with model selector and chat title
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Settings, Download, FileText, FileDown } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';
import { useChatStore } from '../../stores/chat-store';
import { ModelSelector } from '../models/ModelSelector';
import { downloadMarkdown, exportToPdf } from '../../lib/export';

export function ChatHeader() {
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const setView = useUIStore(s => s.setView);
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  
  const activeConversationId = useChatStore(s => s.activeConversationId);
  const conversations = useChatStore(s => s.conversations);
  const selectConversation = useChatStore(s => s.selectConversation);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const messages = useChatStore(s => s.messages);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      flexShrink: 0,
    }}>
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexShrink: 1 }}>
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="Open Sidebar (Ctrl+B)"
          >
            <Menu size={18} />
          </button>
        )}
        
        <ModelSelector />
      </div>

      {/* Center section (Title) */}
      <div style={{
        flex: 1,
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: '0 16px',
      }}>
        {activeConv?.title || ''}
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => selectConversation('')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          title="New Chat (Ctrl+N)"
        >
          <Plus size={18} />
        </button>

        <button
          onClick={() => setView('settings')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          title="Settings (Ctrl+,)"
        >
          <Settings size={18} />
        </button>

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!activeConv || messages.length === 0}
            style={{
              background: 'none',
              border: 'none',
              color: (!activeConv || messages.length === 0) ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: (!activeConv || messages.length === 0) ? 'default' : 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { 
              if (!activeConv || messages.length === 0) return;
              e.currentTarget.style.background = 'var(--bg-hover)'; 
              e.currentTarget.style.color = 'var(--text-primary)'; 
            }}
            onMouseLeave={(e) => { 
              if (!activeConv || messages.length === 0) return;
              e.currentTarget.style.background = 'none'; 
              e.currentTarget.style.color = 'var(--text-secondary)'; 
            }}
            title="Export Chat"
          >
            <Download size={18} />
          </button>

          {showExportMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 8,
              minWidth: 160,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <button
                onClick={() => {
                  downloadMarkdown(activeConv?.title || 'Chat', messages);
                  setShowExportMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FileText size={16} /> Markdown (.md)
              </button>
              <button
                onClick={() => {
                  exportToPdf(activeConv?.title || 'Chat', messages);
                  setShowExportMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FileDown size={16} /> PDF (.pdf)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
