// ─────────────────────────────────────────────────────────────
// Service Worker Entry — Background script for Manifest V3
// ─────────────────────────────────────────────────────────────

import { handleMessage } from './message-handler';
import { handleChatStream, cancelStream } from './stream-manager';
import { STREAM_PORT_NAME } from '../lib/constants';
import { startStorageMonitor } from '../db/cleanup';

// Start storage quota monitor
startStorageMonitor();

// ── Side Panel Setup ──────────────────────────────────────
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

// ── One-shot Message Listener ─────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message || 'Internal error' });
    });
  // Return true to indicate async response
  return true;
});

// ── Port-based Streaming Listener ─────────────────────────
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== STREAM_PORT_NAME) return;

  port.onMessage.addListener(async (message) => {
    switch (message.type) {
      case 'CHAT_REQUEST':
        const requestId = message.payload.requestId || crypto.randomUUID();
        await handleChatStream(port, message.payload, requestId);
        break;

      case 'STOP_GENERATION':
        cancelStream(message.payload.requestId);
        break;
    }
  });

  port.onDisconnect.addListener(() => {
    // Clean up any active streams for this port
    // (handled by the stream manager's finally block)
  });
});

// ── Context Menus Setup ───────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  
  const text = info.selectionText;
  if (!text) return;

  let prompt = text;
  if (info.menuItemId === 'aiside-summarize') {
    prompt = `Please summarize the following text:\n\n${text}`;
  } else if (info.menuItemId === 'aiside-explain') {
    prompt = `Please explain the following text in detail:\n\n${text}`;
  } else if (info.menuItemId === 'aiside-translate') {
    prompt = `Please translate the following text to English:\n\n${text}`;
  } else if (info.menuItemId === 'aiside-ask') {
    prompt = text;
  }

  // Save to local storage for the sidepanel to pick up
  await chrome.storage.local.set({ pending_context_action: prompt });

  // Open the sidepanel in the current window
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(console.warn);
  }
});

// ── Extension Install/Update ──────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AISidebar] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[AISidebar] Extension updated to', chrome.runtime.getManifest().version);
  }

  // Create Context Menus
  chrome.contextMenus.create({
    id: 'aiside-parent',
    title: 'AISiDE',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'aiside-ask',
    parentId: 'aiside-parent',
    title: 'Ask AI',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'aiside-summarize',
    parentId: 'aiside-parent',
    title: 'Summarize',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'aiside-explain',
    parentId: 'aiside-parent',
    title: 'Explain',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'aiside-translate',
    parentId: 'aiside-parent',
    title: 'Translate to English',
    contexts: ['selection']
  });
});

console.log('[AISidebar] Service worker started');
