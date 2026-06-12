// Global focus tracker for the agentic extension
// This script runs on all pages and tracks the last focused interactive element.
// It assigns a unique ID to the element and stores it globally so the dom-actor can find it.

(function initFocusTracker() {
  if ((window as any).__ai_focus_tracker_initialized) return;
  (window as any).__ai_focus_tracker_initialized = true;

  let lastFocusedElement: HTMLElement | null = null;
  const ATTR_NAME = 'data-ai-active-element';

  // Helper to ensure an element map exists
  const getElementMap = () => {
    if (!(window as any).__ai_element_map) {
      (window as any).__ai_element_map = new Map<number, HTMLElement>();
    }
    return (window as any).__ai_element_map as Map<number, HTMLElement>;
  };

  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    if (!el) return;

    // Check if it's an interactive element we care about
    const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
    const isContentEditable = el.isContentEditable;
    const isCodeEditor = el.closest('.monaco-editor') !== null || el.closest('.CodeMirror') !== null;

    if (isInput || isContentEditable || isCodeEditor) {
      // Clear previous
      if (lastFocusedElement) {
        lastFocusedElement.removeAttribute(ATTR_NAME);
      }
      
      lastFocusedElement = el;
      el.setAttribute(ATTR_NAME, 'true');
      
      // Also register it in the DOM actor map as ID 0 (reserved for the implicit active element)
      const map = getElementMap();
      map.set(0, el);
    }
  }, { capture: true });

  // Fallback: sometimes editors don't trigger focusin but trigger click
  document.addEventListener('pointerdown', (e) => {
    const el = e.target as HTMLElement;
    if (!el) return;
    
    // Check if it's inside a code editor
    if (el.closest('.monaco-editor') || el.closest('.CodeMirror')) {
      const target = (el.closest('.monaco-editor') || el.closest('.CodeMirror')) as HTMLElement;
      // We try to find the hidden textarea
      const textarea = target.querySelector('textarea');
      if (textarea) {
        if (lastFocusedElement) lastFocusedElement.removeAttribute(ATTR_NAME);
        lastFocusedElement = textarea;
        textarea.setAttribute(ATTR_NAME, 'true');
        getElementMap().set(0, textarea);
      }
    }
  }, { capture: true, passive: true });
})();
