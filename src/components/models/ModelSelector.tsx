// ─────────────────────────────────────────────────────────────
// ModelSelector — Dropdowns to select provider and model
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Sparkles, Key, Search, Cpu, Star } from 'lucide-react';
import { useModelStore } from '../../stores/model-store';
import { useProviderStore } from '../../stores/provider-store';
import { useSettingsStore } from '../../stores/settings-store';
import { getAllProviderInfo } from '../../providers/registry';
import type { ProviderId } from '../../types/provider';

export function ModelSelector() {
  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  
  const models = useModelStore(s => s.models);
  const selectModel = useModelStore(s => s.selectModel);
  const getSelectedModel = useModelStore(s => s.getSelectedModel);
  const selectedProviderId = useModelStore(s => s.selectedProviderId);
  const selectedModelId = useModelStore(s => s.selectedModelId);
  
  const getConfiguredProviders = useProviderStore(s => s.getConfiguredProviders);
  const configuredProviders = getConfiguredProviders();

  const favoriteModels = useSettingsStore(s => s.settings.model.favoriteModels || []);
  const toggleFavoriteModel = useSettingsStore(s => s.toggleFavoriteModel);

  const selectedModel = getSelectedModel();

  // If we have models but none selected, select the first one
  useEffect(() => {
    if (!selectedModelId && models.length > 0 && configuredProviders.length > 0) {
      // Find the first model that belongs to a configured provider
      const configuredProviderIds = configuredProviders.map(p => p.providerId);
      const firstValidModel = models.find(m => configuredProviderIds.includes(m.providerId as any));
      if (firstValidModel) {
        selectModel(firstValidModel.providerId, firstValidModel.modelId);
      }
    }
  }, [models, selectedModelId, configuredProviders, selectModel]);

  // If selected provider changes or loses all models, select a fallback
  useEffect(() => {
    if (selectedProviderId && models.length > 0) {
      const providerModels = models.filter(m => m.providerId === selectedProviderId);
      if (providerModels.length > 0 && !providerModels.find(m => m.modelId === selectedModelId)) {
        selectModel(selectedProviderId, providerModels[0].modelId);
      }
    }
  }, [selectedProviderId, selectedModelId, models, selectModel]);

  if (configuredProviders.length === 0) {
    return (
      <div style={{
        padding: '6px 12px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        border: '1px dashed var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <Key size={14} />
        No providers configured
      </div>
    );
  }

  // Get active provider info
  const allProviders = getAllProviderInfo();
  const activeProvider = allProviders.find(p => p.id === selectedProviderId) || 
                         allProviders.find(p => p.id === configuredProviders[0].providerId);

  // Available models for active provider
  const availableModels = models
    .filter(m => m.providerId === activeProvider?.id)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const filteredModels = availableModels.filter(m => 
    m.displayName.toLowerCase().includes(modelSearch.toLowerCase()) || 
    m.modelId.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleProviderSelect = (pId: ProviderId) => {
    setProviderOpen(false);
    // Find first model for this provider
    const pModels = models.filter(m => m.providerId === pId);
    if (pModels.length > 0) {
      selectModel(pId, pModels[0].modelId);
    } else {
      // Just set provider, let useEffect handle fallback if models load later
      useModelStore.setState({ selectedProviderId: pId });
    }
  };

  const handleModelSelect = (mId: string, pId?: string) => {
    const providerToUse = pId || activeProvider?.id;
    if (providerToUse) {
      selectModel(providerToUse as ProviderId, mId);
    }
    setModelOpen(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Provider Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setProviderOpen(!providerOpen); setModelOpen(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Cpu size={14} style={{ color: 'var(--accent)' }} />
          <span className="hide-on-narrow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
            {activeProvider?.name || 'Select Provider'}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>

        {providerOpen && (
          <>
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
              onClick={() => setProviderOpen(false)} 
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 200,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              padding: '4px',
            }}>
              {configuredProviders.map(cp => {
                const pInfo = allProviders.find(p => p.id === cp.providerId);
                if (!pInfo) return null;
                const isSelected = pInfo.id === activeProvider?.id;
                
                return (
                  <button
                    key={pInfo.id}
                    onClick={() => handleProviderSelect(pInfo.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 500 : 400,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {pInfo.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>/</span>

      {/* Model Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <button
          onClick={() => { setModelOpen(!modelOpen); setProviderOpen(false); setModelSearch(''); }}
          disabled={!activeProvider || availableModels.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: (!activeProvider || availableModels.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!activeProvider || availableModels.length === 0) ? 0.6 : 1,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { 
            if (activeProvider && availableModels.length > 0) {
              e.currentTarget.style.borderColor = 'var(--border-focus)'; 
            }
          }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span className="hide-on-narrow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
            {selectedModel?.displayName || 'Select Model'}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>

        <button 
          onClick={() => { setModelOpen(!modelOpen); setProviderOpen(false); setModelSearch(''); }}
          disabled={!activeProvider || availableModels.length === 0}
          title="Search Models"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '6px',
            color: 'var(--text-muted)',
            cursor: (!activeProvider || availableModels.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!activeProvider || availableModels.length === 0) ? 0.6 : 1,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { 
            if (activeProvider && availableModels.length > 0) {
              e.currentTarget.style.borderColor = 'var(--border-focus)'; 
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.borderColor = 'var(--border)'; 
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Search size={14} />
        </button>

        {modelOpen && (
          <>
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
              onClick={() => setModelOpen(false)} 
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 260,
              maxHeight: 320,
              overflowY: 'hidden',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search models..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px 6px 28px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '4px', display: 'flex', flexDirection: 'column' }}>
                {favoriteModels.length > 0 && !modelSearch && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Favorites
                    </div>
                    {favoriteModels.map(favId => {
                      const [pId, mId] = favId.split(':');
                      const model = models.find(m => m.providerId === pId && m.modelId === mId);
                      if (!model) return null;
                      
                      const pInfo = allProviders.find(p => p.id === pId);
                      const isSelected = selectedModel?.id === model.id;
                      
                      return (
                        <button
                          key={`fav-${favId}`}
                          onClick={() => handleModelSelect(model.modelId, pId)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '8px 12px',
                            background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            width: '100%',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontWeight: isSelected ? 600 : 400,
                          }}>
                            <span>
                              {model.displayName}
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>
                                {pInfo?.name || pId}
                              </span>
                            </span>
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteModel(favId);
                              }}
                              style={{ padding: 4, display: 'flex', color: 'var(--accent)' }}
                            >
                              <Star size={14} fill="currentColor" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 8px 4px 8px' }} />
                    <div style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Available ({activeProvider?.name})
                    </div>
                  </div>
                )}
                
              {filteredModels.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No models available
                </div>
              ) : (
                filteredModels.map(model => {
                  const isSelected = selectedModel?.id === model.id;
                  const favId = `${model.providerId}:${model.modelId}`;
                  const isFav = favoriteModels.includes(favId);
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.modelId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '8px 12px',
                        background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%',
                        color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 400,
                      }}>
                        {model.displayName}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModel(favId);
                          }}
                          style={{ 
                            padding: 4, 
                            display: 'flex', 
                            color: isFav ? 'var(--accent)' : 'var(--text-muted)',
                            opacity: isFav ? 1 : 0.4
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => { if (!isFav) e.currentTarget.style.opacity = '0.4'; }}
                        >
                          <Star size={14} fill={isFav ? "currentColor" : "none"} />
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 8,
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginTop: 4,
                      }}>
                        <span>{Math.round(model.contextWindow / 1000)}k ctx</span>
                        {model.supportsReasoning && <span>• Reasoning</span>}
                        {model.supportsVision && <span>• Vision</span>}
                      </div>
                    </button>
                  );
                })
              )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
