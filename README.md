<div align="center">
  <img src="public/icons/icon-128.png" alt="AI Sidebar Logo" width="128" height="128" />
  
  <h1>AI Sidebar Extension</h1>
  <p><strong>Your personal, intelligent browsing sidekick 🚀</strong></p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
    <img src="https://img.shields.io/badge/react-18.x-61dafb.svg" alt="React" />
    <img src="https://img.shields.io/badge/vite-6.x-646cff.svg" alt="Vite" />
  </p>
</div>

<br />

Hey there! 👋 Welcome to **AI Sidebar** — a Chrome extension we built to bring the power of advanced LLMs directly into your browser. Instead of switching tabs to talk to ChatGPT or Claude, AI Sidebar sits right next to whatever you're working on. It's designed to be smart, extremely fast, and fiercely protective of your privacy. 

It's not just a chat box, though! It acts as a real agent: it can read the page you're on, browse the web to find answers, and even click and type on web pages for you.

---

## 📸 See it in action

<div align="center">
  <table width="100%">
    <tr>
      <td width="50%" align="center">
        <b>Chat Interface</b><br/>
        <img src="https://i.ibb.co/21nq1HW5/Screenshot-2026-06-12-095632.png" alt="Chat Interface" width="400"/>
        <br/><i>Fast, clean conversations with real-time streaming.</i>
      </td>
      <td width="50%" align="center">
        <b>Settings & Models</b><br/>
        <img src="https://i.ibb.co/23KKxr4x/image.png" alt="Settings" width="400"/>
        <br/><i>Easily swap between your favorite models and secure your API keys.</i>
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>Agentic DOM Interaction</b><br/>
        <img src="https://i.ibb.co/jPQxtx30/image.png" alt="DOM Interaction" width="400"/>
        <br/><i>The AI "sees" your page and can interact with it for you.</i>
      </td>
      <td width="50%" align="center">
        <b>Voice Input</b><br/>
        <img src="https://i.ibb.co/whYBLFGf/image.png" alt="Voice Input" width="400"/>
        <br/><i>Just talk to it! Built-in dictation makes things hands-free.</i>
      </td>
    </tr>
  </table>
</div>

---

## ✨ What makes it special?

- **🧠 Bring Your Own Model:** Whether you love OpenAI, Anthropic, Gemini, Groq, or even local models via Ollama/LMStudio, we've got you covered. You can even mix and match using OpenRouter!
- **🛡️ Truly Private & Secure:** We believe your keys belong to you. All API keys are encrypted at rest using AES-GCM right in your browser. We never track you, and your chat history lives strictly in your local IndexedDB.
- **⚡ Built for Speed:** We engineered a custom `StreamingBuffer` that keeps the UI buttery smooth, even when the AI is dumping thousands of words at once. 
- **🕵️ Real Agentic Powers:** It doesn't just talk; it does things. Tell it to "search the web for X", or "click the login button", and it will autonomously use tools to get it done.
- **📂 Easy Chat Management:** Branch your conversations, easily pick up where you left off, and export your chats whenever you need them.
- **🎙️ Voice Ready:** Tap the mic and just start speaking. It's that easy.

---

## 🛠️ Want to tinker with the code?

If you're a developer and want to run this locally or contribute, here's how to get started:

### What you'll need
- **Node.js** (v18 or newer)
- **npm**, **yarn**, or **pnpm**
- A Chromium browser (Chrome, Edge, Brave, etc.)

### Getting it running

1. **Grab the code:**
   ```bash
   git clone https://github.com/MR-1124/AI-Sidebar.git
   cd AI-Sidebar
   ```

2. **Install the packages:**
   ```bash
   npm install
   ```

3. **Fire up the dev server:**
   ```bash
   npm run dev
   ```
   *Vite will take care of hot-reloading as you make changes!*

### Loading it into Chrome

1. Go to `chrome://extensions/` in your browser.
2. Toggle on **"Developer mode"** in the top right.
3. Click **"Load unpacked"** and select the `dist/` folder inside the project.
4. Pin it to your toolbar and click the icon to open the sidebar. You're good to go!

---

## 🧪 Running Tests

We use `Vitest` to make sure things don't break. You can run the test suite easily:

```bash
# Run everything once
npm run test

# Run in watch mode while coding
npm run test:watch
```

---

## 🏗️ Under the Hood

Curious about the tech stack? Here's what we're running:
- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/) + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Database:** Local `IndexedDB` & `chrome.storage.local`

---

## 🐛 Known Issues & What's Next

> [!WARNING]  
> We're building and shipping fast! Because of this, you might occasionally run into a bug, especially with the AI trying to click complex web elements or handling weird provider rate limits. We're actively improving it every day. If something breaks, please let us know!

## 🤝 Let's build this together!

We would absolutely love your help. If you have an idea, find a bug, or want to add a feature:
1. Open an issue so we can chat about it.
2. Fork the repo and make your branch (`git checkout -b feature/MyCoolIdea`).
3. Commit your tweaks (`git commit -m 'Added this cool thing'`).
4. Push it up (`git push origin feature/MyCoolIdea`).
5. Open a Pull Request!

---

<div align="center">
  <i>Built with ❤️ for power users, tinkerers, and AI enthusiasts.</i>
</div>
