// ─────────────────────────────────────────────────────────────
// Page Extractor — Utility to read content from the active browser tab
// ─────────────────────────────────────────────────────────────

export interface PageContext {
  title: string;
  url: string;
  content: string;
  error?: string;
}

/**
 * Injected script that runs in the context of the active tab.
 * Extracts the inner text of the body, cleans up excessive whitespace,
 * and truncates it to a reasonable maximum length.
 */
function extractPageText(): { title: string; url: string; content: string } {
  // Try to remove common noise elements (scripts, styles, nav, footers) if possible,
  // but for simplicity and safety without mutating the DOM, we'll just extract innerText
  // and do basic cleanup.
  
  // Clone the body to strip out noise without affecting the actual page
  const clone = document.body.cloneNode(true) as HTMLElement;
  
  // Remove known noise tags
  const noiseSelectors = ['script', 'style', 'noscript', 'nav', 'footer', 'header', 'iframe', 'svg'];
  noiseSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Extract text
  let text = clone.innerText || '';
  
  // Clean up excessive whitespace and blank lines
  text = text.replace(/\n\s*\n/g, '\n\n').trim();
  
  // Truncate to approx 15,000 characters to save tokens (~3k-4k tokens)
  const MAX_CHARS = 15000;
  if (text.length > MAX_CHARS) {
    text = text.substring(0, MAX_CHARS) + '\n\n...[Content truncated due to length]...';
  }

  return {
    title: document.title,
    url: window.location.href,
    content: text
  };
}

/**
 * Retrieves the context from the currently active browser tab.
 */
export async function getCurrentPageContext(): Promise<PageContext> {
  try {
    // Note: To query the active tab, we need either the 'tabs' permission
    // or the 'activeTab' permission (which we have, granted on user interaction).
    // We use lastFocusedWindow because currentWindow in a side panel context might refer to the side panel itself.
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (!tab || !tab.id) {
      return { title: '', url: '', content: '', error: 'No active tab found' };
    }

    // Chrome extensions cannot inject scripts into chrome:// or extension pages
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      return { 
        title: tab.title || 'System Page', 
        url: tab.url, 
        content: '', 
        error: 'Cannot read content from system or extension pages.' 
      };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageText,
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }

    return { title: '', url: '', content: '', error: 'Failed to extract content' };
  } catch (err: any) {
    console.error('Page extraction error:', err);
    return { title: '', url: '', content: '', error: err.message || 'Extraction failed' };
  }
}
