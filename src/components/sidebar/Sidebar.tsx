// ─────────────────────────────────────────────────────────────
// Sidebar — Conversation list, search, folders, and bottom nav
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Settings, BarChart2, Search, MessageSquare, Archive, Star, Folder as FolderIcon, Plus, ChevronDown, ChevronRight, MoreVertical, PanelLeftClose, Pin, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';
import { useChatStore } from '../../stores/chat-store';
import { formatRelativeTime } from '../../lib/utils';
import type { Folder } from '../../types/chat';

export function Sidebar() {
  const { sidebarOpen, setView, toggleSidebar } = useUIStore();
  const { conversations, folders, activeConversationId, selectConversation, createConversation, createFolder } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Folder expansion state
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Auto-load conversations on mount
  useEffect(() => {
    useChatStore.getState().loadConversations();
    useChatStore.getState().loadFolders();
  }, []);

  if (!sidebarOpen) return null;

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    selectConversation('');
  };

  const handleNewFolder = async () => {
    const name = prompt('Folder Name:');
    if (name && name.trim()) {
      await createFolder(name.trim());
    }
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Group conversations by folder
  const rootConversations = filteredConversations.filter(c => !c.folderId);
  const conversationsByFolder: Record<string, typeof conversations> = {};
  
  filteredConversations.forEach(c => {
    if (c.folderId) {
      if (!conversationsByFolder[c.folderId]) {
        conversationsByFolder[c.folderId] = [];
      }
      conversationsByFolder[c.folderId].push(c);
    }
  });

  type DateGroup = 'Pinned' | 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

  const getDateGroup = (timestamp: number): 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older' => {
    const now = new Date();
    const date = new Date(timestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - itemDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'Previous 7 Days';
    return 'Older';
  };

  const groupedRootConversations: Record<DateGroup, typeof conversations> = {
    'Pinned': [],
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  rootConversations.forEach(c => {
    if (c.isPinned) {
      groupedRootConversations['Pinned'].push(c);
    } else {
      const group = getDateGroup(c.lastMessageAt || c.createdAt);
      groupedRootConversations[group].push(c);
    }
  });

  const renderConversationItem = (conv: typeof conversations[0], indent = 0) => {
    const isSelected = activeConversationId === conv.id;
    return (
      <div key={conv.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => selectConversation(conv.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: `10px 32px 10px ${12 + indent}px`,
            background: isSelected ? 'var(--bg-active)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background var(--transition-fast)',
            width: '100%',
          }}
          onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
            const actions = e.currentTarget.nextElementSibling as HTMLElement;
            if (actions) actions.style.opacity = '1';
          }}
          onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.background = 'transparent';
            const actions = e.currentTarget.nextElementSibling as HTMLElement;
            if (actions) actions.style.opacity = '0';
          }}
        >
          <MessageSquare size={16} style={{ 
            color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
            flexShrink: 0
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isSelected ? 500 : 400,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              {conv.isPinned && <Pin size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              {conv.title}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              <span>Active: {formatRelativeTime(conv.lastMessageAt)}</span>
              <span style={{ opacity: 0.8 }}>
                Created: {new Date(conv.createdAt).toLocaleString(undefined, { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </button>

        {/* Hover Actions */}
        <div 
          style={{
            position: 'absolute',
            right: 8,
            display: 'flex',
            alignItems: 'center',
            opacity: 0,
            transition: 'opacity var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newFolder = prompt('Enter folder ID to move to (or leave blank for root):');
              if (newFolder !== null) {
                useChatStore.getState().moveToFolder(conv.id, newFolder.trim() || undefined);
              }
            }}
            title="Move to Folder"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 4,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <FolderIcon size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              useChatStore.getState().togglePin(conv.id);
            }}
            title={conv.isPinned ? "Unpin" : "Pin to Top"}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 4,
              color: conv.isPinned ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              marginLeft: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = conv.isPinned ? 'var(--accent-hover)' : 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = conv.isPinned ? 'var(--accent)' : 'var(--text-secondary)'; }}
          >
            <Pin size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this chat?')) {
                useChatStore.getState().deleteConversation(conv.id);
              }
            }}
            title="Delete Chat"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 4,
              color: 'var(--error)',
              cursor: 'pointer',
              display: 'flex',
              marginLeft: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: 'var(--sidebar-width, 280px)',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width var(--transition-fast)',
    }}>
      {/* Header & New Chat */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chat History</h2>
          <button
            onClick={toggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Close Sidebar (Ctrl+B)"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flex: 1,
              padding: '10px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            <Plus size={16} /> New Chat
          </button>
          
          <button
            onClick={handleNewFolder}
            title="New Folder"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          >
            <FolderIcon size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              background: 'var(--bg-tertiary)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
            onFocus={e => {
              e.currentTarget.style.background = 'var(--bg-primary)';
              e.currentTarget.style.borderColor = 'var(--border-focus)';
            }}
            onBlur={e => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />
        </div>
      </div>

      {/* Chat List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {filteredConversations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginTop: 32,
          }}>
            {searchQuery ? 'No chats found' : 'No chats yet'}
          </div>
        ) : (
          <>
            {/* Render Folders */}
            {folders.map(folder => {
              const fConvs = conversationsByFolder[folder.id] || [];
              if (searchQuery && fConvs.length === 0) return null; // Hide empty folders during search
              
              const isExpanded = expandedFolders[folder.id] ?? true; // Default expanded

              return (
                <div key={folder.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    onClick={(e) => toggleFolder(folder.id, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      width: '100%',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <FolderIcon size={14} style={{ color: folder.color || 'inherit' }} />
                    <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{folder.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fConvs.length}</span>
                  </button>

                  {isExpanded && fConvs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {fConvs.map(conv => renderConversationItem(conv, 24))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Spacer if we have both folders and root conversations */}
            {folders.length > 0 && rootConversations.length > 0 && (
              <div style={{ height: 16 }} />
            )}

            {/* Render Root Conversations by Date Group */}
            {(['Pinned', 'Today', 'Yesterday', 'Previous 7 Days', 'Older'] as DateGroup[]).map(group => {
              const items = groupedRootConversations[group];
              if (items.length === 0) return null;
              return (
                <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    padding: '8px 12px 4px 12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {group}
                  </div>
                  {items.map(conv => renderConversationItem(conv, 0))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <button
          onClick={() => setView('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <BarChart2 size={16} /> Analytics & Cost
        </button>
        <button
          onClick={() => setView('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Settings size={16} /> Settings
        </button>
      </div>
    </div>
  );
}
