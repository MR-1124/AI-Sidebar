<div align="center">
  <img src="public/icons/icon-128.png" alt="AI Sidebar Logo" width="128" height="128" />
  
  <h1>AI Sidebar Extension</h1>
  <p><strong>Your Intelligent Browsing Companion</strong></p>

  <p>
    <!-- Placeholder for badges: e.g., build status, version, license -->
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
    <img src="https://img.shields.io/badge/react-18.x-61dafb.svg" alt="React" />
    <img src="https://img.shields.io/badge/vite-6.x-646cff.svg" alt="Vite" />
  </p>
</div>

<br />

AI Sidebar is a powerful, secure, and performant Chrome extension that integrates advanced LLMs directly into your browser's side panel. It acts as an intelligent agent that can read page context, execute multi-step web searches, interact with DOM elements, and assist you with complex tasks while browsing.

---

## 📸 Screenshots

<!-- NOTE: Replace the paths below with actual screenshot images once captured -->

<div align="center">
  <table width="100%">
    <tr>
      <td width="50%" align="center">
        <b>Chat Interface</b><br/>
        <img src="docs/screenshots/chat-interface.png" alt="Chat Interface Screenshot Placeholder" width="400"/>
        <br/><i>The main conversational interface with streaming responses.</i>
      </td>
      <td width="50%" align="center">
        <b>Settings & Models</b><br/>
        <img src="docs/screenshots/settings.png" alt="Settings Screenshot Placeholder" width="400"/>
        <br/><i>Configure multiple providers, models, and API keys securely.</i>
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>Agentic DOM Interaction</b><br/>
        <img src="docs/screenshots/dom-interaction.png" alt="DOM Interaction Screenshot Placeholder" width="400"/>
        <br/><i>The AI analyzing and interacting with the current web page.</i>
      </td>
      <td width="50%" align="center">
        <b>Voice Input & Accessibility</b><br/>
        <img src="docs/screenshots/voice-input.png" alt="Voice Input Screenshot Placeholder" width="400"/>
        <br/><i>Built-in Speech-to-Text for hands-free interactions.</i>
      </td>
    </tr>
  </table>
</div>

---

## ✨ Features

- **🧠 Multi-Model Support:** Connect seamlessly to OpenAI, Anthropic, Gemini, Cohere, Groq, Ollama, LMStudio, and OpenRouter.
- **🛡️ Uncompromising Security:** All API keys are encrypted at-rest using AES-GCM (Web Crypto API) with per-installation key material. The extension implements strict context sanitization and custom permission modals to prevent unauthorized actions.
- **⚡ High Performance:** Designed to handle massive context windows and long-running streaming text efficiently. Built with a custom `StreamingBuffer` to optimize React renders and split-chunk caching.
- **🕵️ Agentic Capabilities:** Powered by an intelligent orchestrator, the AI can recursively call tools. It can search the web (via Tavily/DuckDuckGo) and execute DOM actions like `navigate`, `click`, `fill_form`, and `wait_for_selector`.
- **📂 Conversation Management:** Complete local-first conversation tracking (IndexedDB), message branching (regenerate without losing history), and robust import/export compatibility (supports native, markdown, and ChatGPT JSON formats).
- **🎙️ Voice Input:** Integrated Web Speech API for seamless voice-to-text dictation.

---

## 🛠️ Local Development Setup

Follow these instructions to build and run the AI Sidebar locally.

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** or **pnpm**
- Chromium-based browser (Chrome, Edge, Brave, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MR-1124/AI-Sidebar.git
   cd AI-Sidebar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Vite will start the dev server and handle Hot Module Replacement (HMR).*

### Loading the Extension in Chrome

1. Open your Chromium-based browser and navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** (toggle in the top right corner).
3. Click **"Load unpacked"**.
4. Select the `dist/` folder generated in the `AI-Sidebar` repository (you may need to run `npm run build` first if Vite dev hasn't fully hydrated it, though `@crxjs/vite-plugin` usually handles dev builds well).
5. Pin the extension to your toolbar and click the icon to open the Sidebar!

---

## 🧪 Testing

The repository uses `Vitest` for lightning-fast unit and integration testing.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 🏗️ Architecture Stack

- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Database:** Local `IndexedDB` (via [idb](https://github.com/jakearchibald/idb)) & `chrome.storage.local`
- **Testing:** [Vitest](https://vitest.dev/)

---

## 🔒 Privacy & Security Note

AI Sidebar is designed with a **Local-First** philosophy. 
- All your API keys are stored locally on your machine and encrypted.
- Your conversation history is saved exclusively to your local browser storage (IndexedDB).
- We do not run external tracking, analytics servers, or telemetry beyond basic local logging.

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you would like to change before submitting a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <i>Built with ❤️ for power users and AI enthusiasts.</i>
</div>
