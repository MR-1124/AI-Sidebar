// ─────────────────────────────────────────────────────────────
// DOM Actor — Executes agentic browser interactions on the active tab
// ─────────────────────────────────────────────────────────────

export interface BrowserActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * The payload the AI model sends to interact with the DOM
 */
export interface BrowserActionPayload {
  action: 'click' | 'type' | 'scroll' | 'evaluate' | 'read' | 'navigate' | 'draw_boxes' | 'clear_boxes' | 'extract_dom' | 'observe'
    | 'wait_for_navigation' | 'wait_for_selector' | 'fill_form'
    | 'list_tabs' | 'switch_tab' | 'open_tab' | 'close_tab';
  selector?: string; // legacy fallback
  element_id?: number;
  value?: string;
  press_enter?: boolean;
  tab_id?: number;
  timeout?: number;
  fields?: Array<{ selector: string; value: string }>;
}

/**
 * This function is injected into the target page.
 * It cannot reference outside variables (closures).
 */
function injectedDomActor(payload: BrowserActionPayload): BrowserActionResult {
  try {
    const { action, selector, element_id, value } = payload;

    // Helper to get or create element map on window
    const getElementMap = () => {
      if (!(window as any).__ai_element_map) {
        (window as any).__ai_element_map = new Map<number, HTMLElement>();
      }
      return (window as any).__ai_element_map as Map<number, HTMLElement>;
    };

    if (action === 'scroll') {
      const amount = value === 'up' ? -window.innerHeight : window.innerHeight;
      window.scrollBy({ top: amount, behavior: 'smooth' });
      return { success: true, message: `Scrolled ${value || 'down'}` };
    }

    if (action === 'read') {
      return { success: true, message: 'Page read successfully', data: document.body.innerText };
    }

    if (action === 'extract_dom' || action === 'draw_boxes') {
      const map = getElementMap();
      map.clear();
      
      const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(document.querySelectorAll(interactiveSelectors)) as HTMLElement[];
      
      let counter = 1;
      const domText: string[] = [];
      
      elements.forEach(el => {
        // Skip hidden elements
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null) return;
        
        map.set(counter, el);
        
        let label = el.innerText?.trim() || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('value') || '';
        if (label.length > 50) label = label.substring(0, 47) + '...';
        
        const tag = el.tagName.toLowerCase();
        domText.push(`[${counter}] ${tag} "${label}"`);
        counter++;
      });

      if (action === 'draw_boxes') {
        // Remove existing boxes
        document.querySelectorAll('.ai-bounding-box').forEach(e => e.remove());
        
        map.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const box = document.createElement('div');
          box.className = 'ai-bounding-box';
          box.style.position = 'absolute';
          box.style.top = `${rect.top + window.scrollY}px`;
          box.style.left = `${rect.left + window.scrollX}px`;
          box.style.width = `${rect.width}px`;
          box.style.height = `${rect.height}px`;
          box.style.border = '2px solid rgba(99, 102, 241, 0.8)';
          box.style.background = 'rgba(99, 102, 241, 0.08)';
          box.style.pointerEvents = 'none';
          box.style.zIndex = '999999';
          box.style.borderRadius = '4px';
          
          const label = document.createElement('div');
          label.style.position = 'absolute';
          label.style.top = '-20px';
          label.style.left = '-1px';
          label.style.background = 'rgba(99, 102, 241, 0.9)';
          label.style.color = 'white';
          label.style.fontSize = '11px';
          label.style.padding = '1px 6px';
          label.style.fontWeight = '700';
          label.style.borderRadius = '3px 3px 0 0';
          label.style.fontFamily = 'monospace';
          label.innerText = id.toString();
          
          box.appendChild(label);
          document.body.appendChild(box);
        });
        return { success: true, message: `Drew boxes on ${counter - 1} elements.`, data: domText.join('\n') };
      }
      
      return { success: true, message: `Extracted ${counter - 1} interactive elements.`, data: domText.join('\n') };
    }

    if (action === 'clear_boxes') {
      document.querySelectorAll('.ai-bounding-box').forEach(e => e.remove());
      return { success: true, message: 'Boxes cleared' };
    }

    // Resolving target element
    let el: HTMLElement | undefined;
    
    if (element_id !== undefined) {
      const map = getElementMap();
      el = map.get(element_id);
      if (!el) return { success: false, message: `Element ID [${element_id}] not found in map. You may need to extract_dom first.` };
    } else if (selector) {
      el = document.querySelector(selector) as HTMLElement;
      if (!el && (action === 'click' || action === 'type')) {
        const allElements = Array.from(document.querySelectorAll('button, a, input, [role="button"]')) as HTMLElement[];
        el = allElements.find(e => 
          e.innerText?.toLowerCase().includes(selector.toLowerCase()) || 
          e.getAttribute('aria-label')?.toLowerCase().includes(selector.toLowerCase()) ||
          e.getAttribute('placeholder')?.toLowerCase().includes(selector.toLowerCase())
        ) as HTMLElement;
      }
    } else {
      // Feature 1: Implicit Text Box Detection Fallback
      const map = getElementMap();
      el = map.get(0);
      if (!el) {
        el = document.querySelector('[data-ai-active-element="true"]') as HTMLElement;
      }
      if (!el) {
        // Last resort fallback for active element
        const active = document.activeElement as HTMLElement;
        if (active && active !== document.body) el = active;
      }
    }

    if (!el) {
      return { success: false, message: `Element not found for selector: ${selector || element_id || 'implicit focus'}` };
    }

    // Scroll element into view before acting
    el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });

    if (action === 'click') {
      // Dispatch pointer events to bypass React/Vue blockers
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y }));
      el.click();
      return { success: true, message: `Clicked element: ${element_id || selector}` };
    }

    if (action === 'type') {
      if (el instanceof HTMLSelectElement) {
        // Handle select dropdowns
        const options = Array.from(el.options);
        const targetOption = options.find(o => o.value === value || o.text.includes(value || ''));
        if (targetOption) {
          el.value = targetOption.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, message: `Selected "${targetOption.text}" in dropdown.` };
        }
        return { success: false, message: `Could not find option "${value}" in select.` };
      }
      
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
          el.checked = !el.checked;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, message: `Toggled checkbox/radio.` };
        }
        
        const textToInsert = value || '';
        let inserted = false;
        
        // Strategy 1: Check for global monaco instance
        if ((window as any).monaco && (window as any).monaco.editor) {
          const editors = (window as any).monaco.editor.getEditors();
          if (editors && editors.length > 0) {
            editors[0].setValue(textToInsert);
            inserted = true;
          }
        }
        
        // Strategy 2: Focus and document.execCommand (Universal clipboard/editor bypass)
        if (!inserted) {
          el.focus();
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: new DataTransfer(),
            bubbles: true,
            cancelable: true
          });
          pasteEvent.clipboardData?.setData('text/plain', textToInsert);
          el.dispatchEvent(pasteEvent);
          
          inserted = document.execCommand('insertText', false, textToInsert);
        }
        
        // Strategy 3: React native setter bypass
        if (!inserted) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            el instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
          
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, textToInsert);
          } else {
            el.value = textToInsert;
          }
          
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (payload.press_enter) {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          if (el.form) {
            if (typeof el.form.requestSubmit === 'function') el.form.requestSubmit();
            else el.form.submit();
          }
        }
        
        return { success: true, message: `Typed text into element ${element_id || selector}${payload.press_enter ? ' and pressed Enter' : ''}` };
      } else {
        // Fallback for contenteditable or advanced editors bound to generic divs
        el.focus();
        let inserted = false;
        
        if ((window as any).monaco && (window as any).monaco.editor) {
          const editors = (window as any).monaco.editor.getEditors();
          if (editors && editors.length > 0) {
            editors[0].setValue(value || '');
            inserted = true;
          }
        }
        
        if (!inserted) {
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: new DataTransfer(),
            bubbles: true,
            cancelable: true
          });
          pasteEvent.clipboardData?.setData('text/plain', value || '');
          el.dispatchEvent(pasteEvent);
          
          inserted = document.execCommand('insertText', false, value || '');
        }
        
        if (!inserted && el.isContentEditable) {
          el.innerText = value || '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        return { success: true, message: `Attempted to type into element.` };
      }
    }

    if (action === 'evaluate') {
      return { success: true, message: 'Evaluated successfully', data: el.innerText };
    }

    return { success: false, message: `Unknown action: ${action}` };
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message}` };
  }
}

/**
 * Injected function for fill_form compound action.
 */
function injectedFillForm(fields: Array<{ selector: string; value: string }>): BrowserActionResult {
  try {
    let filled = 0;
    const errors: string[] = [];

    for (const field of fields) {
      const el = document.querySelector(field.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!el) {
        errors.push(`Element not found: ${field.selector}`);
        continue;
      }

      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      el.focus();

      if (el instanceof HTMLSelectElement) {
        const option = Array.from(el.options).find(
          o => o.value === field.value || o.text.toLowerCase().includes(field.value.toLowerCase())
        );
        if (option) {
          el.value = option.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        } else {
          errors.push(`Option "${field.value}" not found in ${field.selector}`);
        }
      } else {
        // Use native setter for React compatibility
        const proto = el instanceof HTMLInputElement
          ? window.HTMLInputElement.prototype
          : window.HTMLTextAreaElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) {
          setter.call(el, field.value);
        } else {
          el.value = field.value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      }
    }

    if (errors.length > 0) {
      return { success: filled > 0, message: `Filled ${filled}/${fields.length} fields. Errors: ${errors.join('; ')}` };
    }
    return { success: true, message: `Successfully filled ${filled} form fields.` };
  } catch (err: any) {
    return { success: false, message: `fill_form error: ${err.message}` };
  }
}

/**
 * Injected function for wait_for_selector.
 */
function injectedWaitForSelector(selectorToWait: string, timeoutMs: number): Promise<BrowserActionResult> {
  return new Promise((resolve) => {
    const el = document.querySelector(selectorToWait);
    if (el) {
      resolve({ success: true, message: `Selector "${selectorToWait}" already present.` });
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selectorToWait)) {
        observer.disconnect();
        resolve({ success: true, message: `Selector "${selectorToWait}" appeared.` });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve({ success: false, message: `Timeout: selector "${selectorToWait}" not found within ${timeoutMs}ms.` });
    }, timeoutMs);
  });
}

/**
 * Executes a browser action on the currently active tab.
 */
export async function executeBrowserAction(payload: BrowserActionPayload): Promise<BrowserActionResult> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab || !tab.id) {
      return { success: false, message: 'No active tab found' };
    }

    if (payload.action === 'navigate') {
      if (!payload.value) {
        return { success: false, message: 'URL is required for navigate action in the value field.' };
      }
      
      let targetUrl = payload.value;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      
      await chrome.tabs.update(tab.id, { url: targetUrl });
      // Auto-wait for navigation to complete
      await new Promise<void>((resolve) => {
        const listener = (tabId: number, info: { status?: string }) => {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        // Safety timeout
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 15000);
      });
      return { success: true, message: `Navigated to ${targetUrl} and page loaded.` };
    }

    // ── Tab management actions (handled at chrome API level) ──
    if (payload.action === 'list_tabs') {
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      const tabList = allTabs.map(t => ({
        id: t.id,
        title: t.title || 'Untitled',
        url: t.url || '',
        active: t.active,
      }));
      return { success: true, message: `Found ${tabList.length} tabs.`, data: tabList };
    }

    if (payload.action === 'switch_tab') {
      if (!payload.tab_id) return { success: false, message: 'tab_id is required for switch_tab.' };
      await chrome.tabs.update(payload.tab_id, { active: true });
      return { success: true, message: `Switched to tab ${payload.tab_id}.` };
    }

    if (payload.action === 'open_tab') {
      if (!payload.value) return { success: false, message: 'URL (value) is required for open_tab.' };
      let targetUrl = payload.value;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      const newTab = await chrome.tabs.create({ url: targetUrl });
      return { success: true, message: `Opened new tab with URL: ${targetUrl}`, data: { tabId: newTab.id } };
    }

    if (payload.action === 'close_tab') {
      const targetTabId = payload.tab_id || tab.id;
      await chrome.tabs.remove(targetTabId);
      return { success: true, message: `Closed tab ${targetTabId}.` };
    }

    // Now enforce DOM restrictions: We cannot run executeScript on chrome:// or chrome-extension://
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
      return { success: false, message: 'Cannot perform DOM interactions (click, type, read, etc.) on system or extension pages. You can use open_tab or navigate to go to a standard web page first.' };
    }

    // ── Wait actions ──
    if (payload.action === 'wait_for_navigation') {
      const timeout = payload.timeout || 10000;
      await new Promise<void>((resolve) => {
        const listener = (tabId: number, info: { status?: string }) => {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, timeout);
      });
      return { success: true, message: 'Page loaded.' };
    }

    if (payload.action === 'wait_for_selector') {
      if (!payload.value) return { success: false, message: 'CSS selector (value) is required for wait_for_selector.' };
      const timeout = payload.timeout || 10000;
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectedWaitForSelector,
        args: [payload.value, timeout],
      });
      if (results && results[0] && results[0].result) {
        return results[0].result as BrowserActionResult;
      }
      return { success: false, message: 'wait_for_selector script execution failed.' };
    }

    if (payload.action === 'fill_form') {
      if (!payload.fields || payload.fields.length === 0) {
        return { success: false, message: 'fields array is required for fill_form action.' };
      }
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectedFillForm,
        args: [payload.fields],
      });
      if (results && results[0] && results[0].result) {
        return results[0].result as BrowserActionResult;
      }
      return { success: false, message: 'fill_form script execution failed.' };
    }

    // ── observe = extract_dom + auto-screenshot ──
    if (payload.action === 'observe') {
      // Run extract_dom first
      const extractPayload = { ...payload, action: 'extract_dom' as const };
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectedDomActor,
        args: [extractPayload],
      });
      if (results && results[0] && results[0].result) {
        const result = results[0].result as BrowserActionResult;
        result.message += ' Use the accompanying screenshot for visual reference.';
        return result;
      }
      return { success: false, message: 'observe: DOM extraction failed.' };
    }

    // Execute the script with a global safety timeout to prevent hanging the orchestrator
    const executePromise = chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectedDomActor,
      args: [payload],
    });

    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('DOM Actor execution timed out after 20 seconds')), 20000);
    });

    const results = await Promise.race([executePromise, timeoutPromise]) as chrome.scripting.InjectionResult[];

    if (results && results[0] && results[0].result) {
      return results[0].result as BrowserActionResult;
    }

    return { success: false, message: 'Failed to get result from script injection' };
  } catch (err: any) {
    console.error('Browser action error:', err);
    return { success: false, message: err.message || 'Execution failed' };
  }
}
