import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { usePromptStore } from '../../stores/prompt-store';
import type { PromptTemplate } from '../../db/repositories/prompt-repo';

export function PromptsSettings() {
  const prompts = usePromptStore(s => s.prompts);
  const createPrompt = usePromptStore(s => s.createPrompt);
  const updatePrompt = usePromptStore(s => s.updatePrompt);
  const deletePrompt = usePromptStore(s => s.deletePrompt);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleEdit = (prompt: PromptTemplate) => {
    setEditingId(prompt.id);
    setFormData({ name: prompt.name, category: prompt.category, content: prompt.content });
    setIsCreating(false);
  };

  const handleNew = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ name: '', category: '', content: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) return;
    
    if (isCreating) {
      await createPrompt({
        name: formData.name,
        category: formData.category || 'General',
        content: formData.content,
      });
    } else if (editingId) {
      await updatePrompt(editingId, {
        name: formData.name,
        category: formData.category || 'General',
        content: formData.content,
      });
    }
    
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', category: '', content: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Prompt Library</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Create reusable prompt templates. Use them in chat by typing '/' in the input box.
          </p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={handleNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Plus size={16} /> New Prompt
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Name (Slash command)</label>
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. summarize, refactor"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Category</label>
            <input
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Coding, Writing"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Content</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="Prompt template content..."
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => { setIsCreating(false); setEditingId(null); }}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.content.trim()}
              style={{
                padding: '8px 16px',
                background: 'var(--accent)',
                border: 'none',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                cursor: (!formData.name.trim() || !formData.content.trim()) ? 'not-allowed' : 'pointer',
                opacity: (!formData.name.trim() || !formData.content.trim()) ? 0.6 : 1,
              }}
            >
              Save Prompt
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {prompts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No prompts found. Create one to get started!
          </div>
        ) : (
          prompts.map(prompt => (
            <div key={prompt.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>/{prompt.name}</h3>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-secondary)'
                  }}>
                    {prompt.category}
                  </span>
                </div>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.85rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {prompt.content}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEdit(prompt)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 8,
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    padding: 8,
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
