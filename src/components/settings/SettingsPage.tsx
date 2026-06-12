// ─────────────────────────────────────────────────────────────
// SettingsPage — Provider configuration and global preferences
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { X, Key, Shield, HardDrive, Layout, Command, Download, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useProviderStore } from '../../stores/provider-store';
import { useModelStore } from '../../stores/model-store';
import { getAllProviderInfo } from '../../providers/registry';
import { PromptsSettings } from './PromptsSettings';
import { ModelsSettings } from './ModelsSettings';
import { PrivacySettings } from './PrivacySettings';
import { ExportSettings } from './ExportSettings';
import { ShortcutsSettings } from './ShortcutsSettings';
import { PersonasSettings } from './PersonasSettings';
import { FeedbackSettings } from './FeedbackSettings';
import type { ProviderId, ProviderStatus } from '../../types/provider';
import type { SettingsTab } from '../../stores/ui-store';
import { Globe, PanelLeftClose, PanelLeft, User, MousePointer2, MessageSquare } from 'lucide-react';

export function SettingsPage() {
  const { setView, settingsTab, setSettingsTab, settingsSidebarCollapsed, toggleSettingsSidebar } = useUIStore();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: 'var(--bg-primary)',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 50,
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 64,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Settings</h1>
        <button
          onClick={() => setView('chat')}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
        >
          <X size={18} />
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <div style={{
          width: settingsSidebarCollapsed ? 68 : 240,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          padding: settingsSidebarCollapsed ? '24px 8px' : '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          transition: 'all var(--transition-fast)',
        }}>
          <TabButton id="providers" icon={<Key size={16} />} label="Providers & API Keys" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="tools" icon={<Globe size={16} />} label="Tools & Search" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="general" icon={<Layout size={16} />} label="General" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="models" icon={<HardDrive size={16} />} label="Models" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="personas" icon={<User size={16} />} label="Personas" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="prompts" icon={<Command size={16} />} label="Prompts Library" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="privacy" icon={<Shield size={16} />} label="Privacy & Security" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="export" icon={<Download size={16} />} label="Data Export" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          <TabButton id="shortcuts" icon={<Command size={16} />} label="Shortcuts" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />
          
          <div style={{ margin: '8px 0', borderBottom: '1px solid var(--border)' }} />
          <TabButton id="feedback" icon={<MessageSquare size={16} />} label="Feedback" current={settingsTab} onClick={setSettingsTab} collapsed={settingsSidebarCollapsed} />

          <div style={{ flex: 1 }} />
          
          <button
            onClick={toggleSettingsSidebar}
            title={settingsSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: settingsSidebarCollapsed ? 'center' : 'flex-start',
              gap: 12,
              padding: settingsSidebarCollapsed ? '10px 0' : '10px 16px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
              marginTop: 16,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {settingsSidebarCollapsed ? <PanelLeft size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {settingsTab === 'providers' && <ProviderSettings />}
            {settingsTab === 'tools' && <ToolsSettings />}
            {settingsTab === 'general' && <GeneralSettings />}
            {settingsTab === 'models' && <ModelsSettings />}
            {settingsTab === 'personas' && <PersonasSettings />}
            {settingsTab === 'prompts' && <PromptsSettings />}
            {settingsTab === 'privacy' && <PrivacySettings />}
            {settingsTab === 'export' && <ExportSettings />}
            {settingsTab === 'shortcuts' && <ShortcutsSettings />}
            {settingsTab === 'feedback' && <FeedbackSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Button Component ─────────────────────────────────────

function TabButton({ id, icon, label, current, onClick, collapsed }: { id: SettingsTab, icon: React.ReactNode, label: string, current: SettingsTab, onClick: (id: SettingsTab) => void, collapsed?: boolean }) {
  const active = current === id;
  return (
    <button
      onClick={() => onClick(id)}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 12,
        padding: collapsed ? '10px 0' : '10px 16px',
        background: active ? 'var(--bg-active)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.9rem',
        fontWeight: active ? 500 : 400,
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {icon} {!collapsed && label}
    </button>
  );
}

// ── Provider Settings Component ──────────────────────────────

function ProviderSettings() {
  const providers = getAllProviderInfo();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Providers & API Keys</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure API keys for the AI providers you want to use. Keys are encrypted locally and never sent anywhere except directly to the provider's API.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {providers.map(provider => (
          <ProviderCard key={provider.id} providerInfo={provider} />
        ))}
      </div>
    </div>
  );
}

function ProviderCard({ providerInfo }: { providerInfo: ReturnType<typeof getAllProviderInfo>[0] }) {
  const providerState = useProviderStore(s => s.providers[providerInfo.id]);
  const setProviderConfig = useProviderStore(s => s.setProviderConfig);
  const setProviderStatus = useProviderStore(s => s.setProviderStatus);
  const removeProvider = useProviderStore(s => s.removeProvider);
  
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(providerState?.customBaseUrl || '');
  const [isEditing, setIsEditing] = useState(!providerState?.encryptedApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const isConfigured = !!providerState?.encryptedApiKey;

  const isLocalProvider = providerInfo.id === 'ollama' || providerInfo.id === 'lmstudio';

  const handleValidate = () => {
    if (!isLocalProvider && !apiKey.trim()) {
      setError('API key is required');
      return;
    }
    
    if (providerInfo.apiKeyPattern && !providerInfo.apiKeyPattern.test(apiKey)) {
      setError(`Invalid format. It should look like: ${providerInfo.apiKeyPlaceholder}`);
      return;
    }

    setIsValidating(true);
    setError('');

    // Send validation request to service worker
    chrome.runtime.sendMessage(
      { type: 'VALIDATE_KEY', payload: { providerId: providerInfo.id, apiKey, customBaseUrl } },
      (response) => {
        setIsValidating(false);
        if (response.payload.valid) {
          setIsEditing(false);
          setApiKey(''); // Clear plain text key from state
          // The service worker already stored the encrypted key and updated status.
          // We just need to trigger a re-render by reloading providers in the store
          useProviderStore.getState().loadProviders();
          
          if (response.payload.models && response.payload.models.length > 0) {
            useModelStore.getState().setModels(providerInfo.id, response.payload.models);
          }
        } else {
          setError(response.payload.error || 'Validation failed');
          setProviderStatus(providerInfo.id, 'invalid', response.payload.error);
        }
      }
    );
  };

  const handleRemove = () => {
    removeProvider(providerInfo.id);
    setIsEditing(true);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${isConfigured ? 'var(--border)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Card Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: isEditing ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            {/* Fallback to simple letter if no icon loaded yet */}
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{providerInfo.name[0]}</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{providerInfo.name}</h3>
              {isConfigured && !isEditing && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: 'var(--success)',
                  background: 'var(--success-subtle)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  <Check size={12} /> Connected
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{providerInfo.description}</p>
          </div>
        </div>

        {isConfigured && !isEditing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Card Body (Editing Mode) */}
      {isEditing && (
        <div style={{ padding: '20px', background: 'var(--bg-primary)' }}>
          {!isLocalProvider ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                API Key
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setError(''); }}
                  placeholder={providerInfo.apiKeyPlaceholder}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onFocus={e => !error && (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => !error && (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  onClick={handleValidate}
                  disabled={isValidating || (!isLocalProvider && !apiKey.trim())}
                  style={{
                    padding: '0 20px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 500,
                    cursor: (isValidating || (!isLocalProvider && !apiKey.trim())) ? 'not-allowed' : 'pointer',
                    opacity: (isValidating || (!isLocalProvider && !apiKey.trim())) ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isValidating ? <><Loader2 size={16} className="animate-spin" /> Verifying</> : 'Connect'}
                </button>
              </div>
              {error && (
                <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: 8 }}>
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                Local Server URL
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  placeholder={providerInfo.id === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  style={{
                    padding: '0 20px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 500,
                    cursor: isValidating ? 'not-allowed' : 'pointer',
                    opacity: isValidating ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isValidating ? <><Loader2 size={16} className="animate-spin" /> Verifying</> : 'Connect'}
                </button>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>
                Override the default {providerInfo.name} URL (e.g. if running on a different port or machine).
              </div>
              {error && (
                <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: 8 }}>
                  {error}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <a href={providerInfo.apiKeyUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Get your API key <ExternalLink size={12} />
            </a>
            
            {isConfigured && (
              <button
                onClick={handleRemove}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--error)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Remove connection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tools Settings Component ───────────────────────────────

function ToolsSettings() {
  const settings = useSettingsStore(s => s.settings.tools);
  const updateTools = useSettingsStore(s => s.updateTools);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Tools & Search</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure API keys and preferences for external tools like web search.
        </p>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <Globe size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Web Search Provider</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Choose which engine to use when a model searches the web.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
            Search Engine
          </label>
          <select
            value={settings?.searchEngine || 'duckduckgo'}
            onChange={(e) => updateTools({ searchEngine: e.target.value as 'tavily' | 'duckduckgo' })}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          >
            <option value="duckduckgo">DuckDuckGo (Free, No API Key)</option>
            <option value="tavily">Tavily (API Key Required)</option>
          </select>
        </div>

        {settings?.searchEngine === 'tavily' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
              Tavily API Key <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.8rem', marginLeft: 8 }}>Get Key →</a>
            </label>
            <input
              type="password"
              value={settings?.tavilyApiKey || ''}
              onChange={(e) => updateTools({ tavilyApiKey: e.target.value })}
              placeholder="tvly-..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        )}
      </div>

      {/* Browser Interaction Block */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <MousePointer2 size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Agentic Browser Interaction</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Allow the AI to click buttons, fill forms, and interact with the active webpage on your behalf.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Enable Interaction Tools</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exposes the DOM interaction tool to the model.</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings?.enableBrowserInteraction || false}
              onChange={(e) => updateTools({ enableBrowserInteraction: e.target.checked })}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {settings?.enableBrowserInteraction && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
              Execution Permission
            </label>
            <select
              value={settings?.browserInteractionPermission || 'ask'}
              onChange={(e) => updateTools({ browserInteractionPermission: e.target.value as 'ask' | 'automatic' })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              <option value="ask">Always Ask (Require click to execute)</option>
              <option value="automatic">Always Allow Automatic (Execute immediately)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// ── General Settings Component ───────────────────────────────

function GeneralSettings() {
  const settings = useSettingsStore(s => s.settings.general);
  const updateGeneral = useSettingsStore(s => s.updateGeneral);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>General Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Customize your experience.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Theme */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Theme</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose light or dark mode.</div>
          </div>
          <select
            value={settings.theme}
            onChange={(e) => updateGeneral({ theme: e.target.value as any })}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="system">System Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        {/* Send on Enter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Send on Enter</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Press Enter to send, Shift+Enter for new line.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.sendOnEnter}
            onChange={(e) => updateGeneral({ sendOnEnter: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Show Token Count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Show Token Count</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Display token usage below each response.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.showTokenCount}
            onChange={(e) => updateGeneral({ showTokenCount: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Global Shortcut Info */}
        <div style={{ 
          marginTop: 8,
          padding: '16px', 
          background: 'var(--bg-tertiary)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)' 
        }}>
          <div style={{ fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            Extension Shortcut
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            You can open or close this sidepanel instantly from any tab by pressing <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>Ctrl+Shift+Space</kbd> (or <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>Cmd+Shift+Space</kbd> on Mac).
            <br />
            <a href="chrome://extensions/shortcuts" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
              Change shortcut in Chrome Settings →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
