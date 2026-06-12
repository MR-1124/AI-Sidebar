// ─────────────────────────────────────────────────────────────
// Folder Modals — UI for Folder management and moving chats
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { X, Folder as FolderIcon, AlertTriangle, Check } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import type { Folder } from '../../types/chat';

const COLORS = [
  'var(--text-primary)',
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

interface ModalOverlayProps {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

function ModalOverlay({ onClose, children, title }: ModalOverlayProps) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInUp var(--transition-fast) ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Folder Edit Modal (Create / Rename) ─────────────────────────────────

interface FolderEditModalProps {
  folder?: Folder; // If provided, we are editing. If undefined, creating.
  onClose: () => void;
}

export function FolderEditModal({ folder, onClose }: FolderEditModalProps) {
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || COLORS[0]);
  const { createFolder, updateFolder } = useChatStore();

  const handleSave = async () => {
    if (!name.trim()) return;
    if (folder) {
      await updateFolder(folder.id, { name: name.trim(), color: color === COLORS[0] ? undefined : color });
    } else {
      await createFolder(name.trim(), undefined, color === COLORS[0] ? undefined : color);
    }
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose} title={folder ? 'Edit Folder' : 'New Folder'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Folder Name
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Folder Color
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c === 'var(--text-primary)' ? 'var(--text-primary)' : c,
                  border: color === c ? '2px solid var(--bg-elevated)' : 'none',
                  boxShadow: color === c ? `0 0 0 2px ${c === 'var(--text-primary)' ? 'var(--text-secondary)' : c}` : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem',
              fontWeight: 500,
              opacity: name.trim() ? 1 : 0.5,
            }}
            onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { if (name.trim()) e.currentTarget.style.background = 'var(--accent)' }}
          >
            Save
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Folder Delete Modal ─────────────────────────────────────────────────

interface FolderDeleteModalProps {
  folder: Folder;
  onClose: () => void;
}

export function FolderDeleteModal({ folder, onClose }: FolderDeleteModalProps) {
  const { deleteFolder } = useChatStore();

  const handleDelete = async () => {
    await deleteFolder(folder.id);
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose} title="Delete Folder">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          <AlertTriangle size={24} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <div>
            <p style={{ marginBottom: 8 }}>
              Are you sure you want to delete the folder <strong>"{folder.name}"</strong>?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Any conversations inside this folder will not be deleted, they will simply be moved back to the main chat list.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              background: 'var(--error)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--error) 80%, black)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--error)'}
          >
            Delete
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Move Chat Modal ─────────────────────────────────────────────────────

interface MoveChatModalProps {
  conversationId: string;
  currentFolderId?: string;
  onClose: () => void;
}

export function MoveChatModal({ conversationId, currentFolderId, onClose }: MoveChatModalProps) {
  const { folders, moveToFolder } = useChatStore();

  const handleMove = async (folderId: string | undefined) => {
    await moveToFolder(conversationId, folderId);
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose} title="Move to Folder">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
        <button
          onClick={() => handleMove(undefined)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: !currentFolderId ? 'var(--bg-active)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.9rem',
          }}
          onMouseEnter={e => { if (currentFolderId) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { if (currentFolderId) e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderIcon size={16} style={{ color: 'var(--text-muted)' }} />
            Main Chat List (Root)
          </div>
          {!currentFolderId && <Check size={16} style={{ color: 'var(--accent)' }} />}
        </button>

        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => handleMove(folder.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: currentFolderId === folder.id ? 'var(--bg-active)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
            onMouseEnter={e => { if (currentFolderId !== folder.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (currentFolderId !== folder.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderIcon size={16} style={{ color: folder.color || 'var(--text-muted)' }} />
              {folder.name}
            </div>
            {currentFolderId === folder.id && <Check size={16} style={{ color: 'var(--accent)' }} />}
          </button>
        ))}
        
        {folders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No folders created yet.
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
