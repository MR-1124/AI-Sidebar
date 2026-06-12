// ─────────────────────────────────────────────────────────────
// App — Root component and view orchestrator
// ─────────────────────────────────────────────────────────────

import React, { useEffect, Suspense } from 'react';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatView } from './components/chat/ChatView';
import { useUIStore } from './stores/ui-store';
import { useSettingsStore } from './stores/settings-store';
import { useProviderStore } from './stores/provider-store';
import { useModelStore } from './stores/model-store';
import { useChatStore } from './stores/chat-store';
import { usePromptStore } from './stores/prompt-store';
import { GlobalSearch } from './components/GlobalSearch';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { useGlobalShortcuts } from './hooks/useShortcuts';

const SettingsPage = React.lazy(() => import('./components/settings/SettingsPage').then(module => ({ default: module.SettingsPage })));
const AnalyticsPage = React.lazy(() => import('./components/analytics/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));

export default function App() {
  const { currentView, sidebarWidth } = useUIStore();
  const { loaded: settingsLoaded, loadSettings, settings } = useSettingsStore();
  const { loaded: providersLoaded, loadProviders } = useProviderStore();
  const { loaded: modelsLoaded, loadModels } = useModelStore();
  const { loaded: chatLoaded, loadConversations, loadFolders } = useChatStore();
  const { loaded: promptsLoaded, loadPrompts } = usePromptStore();

  const [appInitialized, setAppInitialized] = React.useState(false);

  // Global Shortcuts
  useGlobalShortcuts();

  // Initialization
  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadProviders();
      await loadModels();
      await loadConversations();
      await loadFolders();
      await loadPrompts();

      // Auto-refresh models if they are missing for any configured provider
      const { providers } = useProviderStore.getState();
      const { models, refreshModels } = useModelStore.getState();
      const configuredProviders = Object.values(providers).filter(p => p.isEnabled && p.status === 'valid');
      
      for (const cp of configuredProviders) {
        const hasModels = models.some(m => m.providerId === cp.providerId);
        if (!hasModels) {
          refreshModels(cp.providerId).catch(console.warn);
        }
      }

      // Restore model selection
      const { settings } = useSettingsStore.getState();
      const { selectModel } = useModelStore.getState();
      if (settings.model.defaultProviderId && settings.model.defaultModelId) {
        selectModel(settings.model.defaultProviderId, settings.model.defaultModelId);
      }

      // Restore conversation selection
      const { selectConversation, conversations } = useChatStore.getState();
      if (settings.general.startupBehavior === 'last-chat' && settings.chat.lastActiveConversationId) {
        // Only select if it still exists
        if (conversations.some(c => c.id === settings.chat.lastActiveConversationId)) {
          selectConversation(settings.chat.lastActiveConversationId).catch(console.warn);
        }
      }

      setAppInitialized(true);
    };
    init();
  }, [loadSettings, loadProviders, loadModels, loadConversations, loadFolders, loadPrompts]);

  // Apply Theme
  useEffect(() => {
    if (settingsLoaded) {
      if (settings.general.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', settings.general.theme);
      }
    }
  }, [settingsLoaded, settings.general.theme]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    if (settingsLoaded && settings.general.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settingsLoaded, settings.general.theme]);

  // Handle Context Menu actions from background worker
  useEffect(() => {
    if (!appInitialized || typeof chrome === 'undefined' || !chrome.storage) return;

    const handlePendingContext = async (prompt: string) => {
      const { activeConversationId, createConversation, addUserMessage } = useChatStore.getState();
      const { selectedProviderId, selectedModelId } = useModelStore.getState();
      
      let convId = activeConversationId;
      if (!convId) {
        if (!selectedProviderId || !selectedModelId) return;
        const newConv = await createConversation(selectedProviderId, selectedModelId);
        convId = newConv.id;
      }
      
      if (convId) {
        // We simulate sending a message
        // The actual chat view might be handling the generation, but let's just add the user message
        // Actually, to trigger generation properly, we should use a custom event or a store function.
        // For now, let's dispatch a custom DOM event so MessageInput can pick it up and trigger the stream.
        window.dispatchEvent(new CustomEvent('aiside-context-action', { detail: { prompt } }));
      }
    };

    // Check on mount
    chrome.storage.local.get(['pending_context_action'], (result) => {
      if (result.pending_context_action) {
        handlePendingContext(result.pending_context_action as string);
        chrome.storage.local.remove(['pending_context_action']);
      }
    });

    // Check on change
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pending_context_action && changes.pending_context_action.newValue) {
        handlePendingContext(changes.pending_context_action.newValue as string);
        chrome.storage.local.remove(['pending_context_action']);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [appInitialized]);

  const isLoaded = settingsLoaded && providersLoaded && modelsLoaded && chatLoaded && promptsLoaded && appInitialized;

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      '--sidebar-width': `${sidebarWidth}px`,
    } as React.CSSProperties}>
      
      {/* Base Layout */}
      <Sidebar />
      <main style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <ErrorBoundary fallbackMessage="Chat view encountered an error">
          <ChatView />
        </ErrorBoundary>
      </main>

      {/* Overlays */}
      <Suspense fallback={
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', zIndex: 100 }}>
          <Loader2 size={32} className="spin" color="var(--accent)" />
        </div>
      }>
        {currentView === 'settings' && (
          <ErrorBoundary fallbackMessage="Settings encountered an error">
            <SettingsPage />
          </ErrorBoundary>
        )}
        {currentView === 'analytics' && (
          <ErrorBoundary fallbackMessage="Analytics encountered an error">
            <AnalyticsPage />
          </ErrorBoundary>
        )}
      </Suspense>
      {/* Search Overlay */}
      <GlobalSearch />
    </div>
  );
}
