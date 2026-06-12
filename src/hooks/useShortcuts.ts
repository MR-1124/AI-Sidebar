import { useEffect } from 'react';
import { useUIStore } from '../stores/ui-store';
import { useChatStore } from '../stores/chat-store';
import { DEFAULT_SHORTCUTS } from '../lib/constants';

export function useGlobalShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow default browser shortcuts (like Ctrl+Shift+I) to pass through
      if (e.altKey || e.shiftKey && e.key !== 'Escape') {
        return; // We only handle pure Ctrl/Meta bindings for now
      }

      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // --- Stop Generation (Escape) ---
      if (key === 'escape') {
        const { isGenerating, activeRequestId, setGenerating } = useUIStore.getState();
        if (isGenerating && activeRequestId) {
          e.preventDefault();
          chrome.runtime.sendMessage({
            type: 'STOP_GENERATION',
            payload: { requestId: activeRequestId },
          });
          setGenerating(false);
          return;
        }
      }

      // If we are typing in an input and no modifier is pressed, ignore shortcuts
      if (isInputFocused && !isCtrlOrCmd) {
        return;
      }

      // --- Global Shortcuts ---
      if (isCtrlOrCmd) {
        switch (key) {
          case 'n':
            e.preventDefault();
            useChatStore.setState({ activeConversationId: null });
            useUIStore.getState().setView('chat');
            document.getElementById('chat-message-input')?.focus();
            break;
            
          case 'b':
            e.preventDefault();
            useUIStore.getState().toggleSidebar();
            break;
            
          case 'k':
            e.preventDefault();
            useUIStore.getState().setSearchOpen(true);
            break;
            
          case ',':
            e.preventDefault();
            useUIStore.getState().setView('settings');
            break;
            
          case 'l':
            e.preventDefault();
            useUIStore.getState().setView('chat');
            document.getElementById('chat-message-input')?.focus();
            break;
            
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
