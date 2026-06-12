import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, User } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import type { Persona } from '../../types/settings';
import { generateId } from '../../lib/utils';

export function PersonasSettings() {
  const settings = useSettingsStore(s => s.settings.chat);
  const updateChat = useSettingsStore(s => s.updateChat);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', prompt: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleEdit = (persona: Persona) => {
    setEditingId(persona.id);
    setFormData({ name: persona.name, description: persona.description, prompt: persona.prompt });
    setIsCreating(false);
  };

  const handleNew = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ name: '', description: '', prompt: '' });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.prompt.trim()) return;
    
    let newPersonas = [...settings.personas];

    if (isCreating) {
      newPersonas.push({
        id: generateId(),
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        isCustom: true
      });
    } else if (editingId) {
      newPersonas = newPersonas.map(p => 
        p.id === editingId 
          ? { ...p, name: formData.name, description: formData.description, prompt: formData.prompt }
          : p
      );
    }
    
    updateChat({ personas: newPersonas });
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', description: '', prompt: '' });
  };

  const handleDelete = (id: string) => {
    const newPersonas = settings.personas.filter(p => p.id !== id);
    const updates: any = { personas: newPersonas };
    if (settings.activePersonaId === id) {
      updates.activePersonaId = newPersonas[0]?.id || null;
    }
    updateChat(updates);
  };

  const handleSelectActive = (id: string) => {
    updateChat({ activePersonaId: id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Personas & System Prompts</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose a Persona to act as the foundational system prompt for all new conversations.
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
            <Plus size={16} /> New Persona
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Persona Name</label>
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Translation Expert"
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Description</label>
            <input
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of this persona's purpose..."
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>System Prompt Instructions</label>
            <textarea
              value={formData.prompt}
              onChange={e => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="You are an expert in..."
              rows={5}
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
              disabled={!formData.name.trim() || !formData.prompt.trim()}
              style={{
                padding: '8px 16px',
                background: 'var(--accent)',
                border: 'none',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                cursor: (!formData.name.trim() || !formData.prompt.trim()) ? 'not-allowed' : 'pointer',
                opacity: (!formData.name.trim() || !formData.prompt.trim()) ? 0.6 : 1,
              }}
            >
              Save Persona
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {settings.personas.map(persona => {
          const isActive = settings.activePersonaId === persona.id;
          return (
            <div key={persona.id} style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              background: isActive ? 'var(--bg-active)' : 'var(--bg-secondary)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              boxShadow: isActive ? 'var(--shadow-md)' : 'none',
              transition: 'all var(--transition-fast)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 32, height: 32, 
                    borderRadius: '50%', 
                    background: isActive ? 'var(--accent)' : 'var(--bg-tertiary)', 
                    color: isActive ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <User size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {persona.name}
                    </h3>
                    {!persona.isCustom && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: 4, color: 'var(--text-muted)' }}>Default</span>
                    )}
                  </div>
                </div>
                {isActive && (
                  <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                    <Check size={14} /> Active
                  </div>
                )}
              </div>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16, flex: 1 }}>
                {persona.description || "No description provided."}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <button
                  onClick={() => handleSelectActive(persona.id)}
                  disabled={isActive}
                  style={{
                    padding: '6px 12px',
                    background: isActive ? 'transparent' : 'var(--bg-tertiary)',
                    border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontSize: '0.8rem',
                    cursor: isActive ? 'default' : 'pointer',
                    fontWeight: 500
                  }}
                >
                  {isActive ? 'Currently Active' : 'Set Active'}
                </button>

                {persona.isCustom && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEdit(persona)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(persona.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
