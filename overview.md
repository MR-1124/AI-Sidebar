# Universal AI Sidebar (AISiDE) - Project Overview

AISiDE is a powerful, unified browser extension (manifest v3) that provides a comprehensive AI chat interface as a Chrome Side Panel. It aggregates multiple AI providers into a single, seamless user experience while boasting advanced agentic web interaction capabilities.

## Architecture & Tech Stack

### Core Technologies
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React (for icons)
- **Extension Build**: `@crxjs/vite-plugin` for robust manifest v3 compilation
- **State Management**: Zustand (modular stores for UI, chat, settings, models, usage, and providers)
- **Database**: Dexie.js (IndexedDB wrapper for persistent storage of conversations and settings)
- **Parsing & Markdown**: React Markdown, Remark/Rehype plugins, Highlight.js for code rendering

### Extension Structure
- **`src/sidepanel/`**: The primary user interface. Renders the main `App.tsx` which houses the Chat, Settings, and Analytics views.
- **`src/background/`**: Service worker scripts (`index.ts`, `message-handler.ts`, `stream-manager.ts`). Handles background API calls, streaming communication, and cross-tab orchestration.
- **`src/content/`**: Contains `focus-tracker.ts`, an injected script that tracks the active element on web pages for advanced agentic typing.
- **`src/lib/`**: Core utilities, including:
  - `dom-actor.ts`: The engine for Agentic Web Interaction (clicks, typing, dom extraction, bounding boxes).
  - `page-extractor.ts`: Utilities to scrape and summarize the active tab's content.
  - `duckduckgo.ts` / `tavily.ts`: Web search integration APIs.
  - `pricing.ts`: Token cost calculation logic.

## Key Features

### 1. Multi-Provider AI Aggregation
- **Supported Providers**: OpenAI, Anthropic, Google Gemini, OpenRouter, DeepSeek, Groq, NVIDIA NIM, Together AI, Mistral, and Cohere.
- **Model Management**: Users can dynamically fetch models from providers, search, filter, and mark models as **Favorites** for quick access.
- **Cost Tracking**: Calculates input/output token usage and estimates costs based on predefined pricing matrices (`pricing.ts`).

### 2. Advanced Agentic Web Interaction
The AI isn't just a chatbot; it can "see" and "control" your browser.
- **DOM Extraction & Bounding Boxes**: The `extract_dom` and `draw_boxes` tools allow the AI to map the webpage structure and overlay visual bounding boxes on interactive elements.
- **Vision Integration**: Automatically captures screenshots (`chrome.tabs.captureVisibleTab`) and sends them to vision-capable models alongside the DOM map.
- **Smart Element Resolution**: The `dom-actor` can interact with elements via CSS selectors, assigned numerical IDs, or implicitly via the **Focus Tracker** (which tracks the user's last focused text box).
- **Advanced Code Editor Support**: Can flawlessly inject code into complex web IDEs (like Monaco/LeetCode and CodeMirror) by detecting native engine APIs or using advanced clipboard bypassing.

### 3. Contextual Awareness
- **Read Active Page**: The AI can scrape and comprehend the content of the currently active tab.
- **Web Search**: Integrated DuckDuckGo and Tavily search engines to ground responses in real-time internet data.
- **File Attachments**: Users can upload images and PDFs. PDFs are processed via `pdf.ts` (using PDF.js) and images are passed natively to vision models.

### 4. Rich User Interface
- **Markdown & Code Rendering**: Full support for rendering complex markdown, tables, and syntax-highlighted code blocks with a quick "Copy Code" button.
- **Streaming Responses**: Real-time token streaming from the background worker to the UI.
- **Voice Output**: (Planned/In-progress) Text-to-speech functionality for reading out AI responses.
- **Global Search**: Search through conversation history.
- **Keyboard Shortcuts**: Customizable shortcuts for quick access to the side panel.

## Data & State Management (`src/stores/`)
- `chat-store.ts`: Manages conversation history, message streaming state, and IndexedDB persistence.
- `settings-store.ts`: Manages API keys, system prompts, theme preferences, and favorite models.
- `provider-store.ts`: Tracks provider status, API endpoints, and validation logic.
- `model-store.ts`: Caches available models across all providers.
- `usage-store.ts`: Tracks token usage and calculated costs over time.

## Recent Upgrades
- Added a persistent **Focus Tracker** to allow the AI to implicitly know where to type on a webpage without needing explicit instructions.
- Implemented **Model-Aware Prompt Strategies** that dynamically adjust system instructions depending on whether a "thinking" model (e.g., `o1`, `gpt-oss-120b`) or standard model (e.g., `gpt-4o`) is used.
- Upgraded the DOM interaction suite to bypass React event blockers and support advanced Monaco IDEs natively.
