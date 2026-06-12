import type { Message } from '../types/chat';
import { useSettingsStore } from '../stores/settings-store';
import html2pdf from 'html2pdf.js';

export function formatChatAsMarkdown(title: string, messages: Message[]): string {
  const settings = useSettingsStore.getState().settings.export;
  let md = `# ${title || 'Chat Export'}\n\n`;

  if (settings.includeMetadata) {
    md += `*Exported on: ${new Date().toLocaleString()}*\n\n`;
  }

  md += `---\n\n`;

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    
    const roleName = msg.role === 'user' ? '👤 User' : (msg.role === 'assistant' ? '🤖 Assistant' : '🛠️ Tool');
    md += `### ${roleName}\n`;
    
    if (settings.includeTimestamps) {
      md += `*${new Date(msg.createdAt).toLocaleTimeString()}*\n\n`;
    }

    if (msg.reasoningContent) {
      md += `> **Thinking process:**\n> ${msg.reasoningContent.replace(/\n/g, '\n> ')}\n\n`;
    }

    md += `${msg.content}\n\n`;

    if (settings.includeTokenUsage && msg.role === 'assistant' && msg.totalTokens) {
      md += `*(Tokens: ${msg.totalTokens})*\n\n`;
    }
    
    md += `---\n\n`;
  }

  return md;
}

export function downloadMarkdown(title: string, messages: Message[]) {
  const md = formatChatAsMarkdown(title, messages);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'chat'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToPdf(title: string, messages: Message[]) {
  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  element.style.color = '#333';
  element.style.lineHeight = '1.6';

  let html = `
    <h1 style="border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">${title || 'Chat Export'}</h1>
    <p style="color: #666; font-size: 0.9em;">Exported on: ${new Date().toLocaleString()}</p>
  `;

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    
    const isUser = msg.role === 'user';
    const bg = isUser ? '#f0f7ff' : '#f9f9f9';
    const border = isUser ? '#cce3ff' : '#eaeaea';
    const name = isUser ? 'User' : 'Assistant';

    html += `
      <div style="margin-top: 20px; padding: 15px; background: ${bg}; border: 1px solid ${border}; border-radius: 8px;">
        <strong style="display: block; margin-bottom: 8px; color: ${isUser ? '#0066cc' : '#333'};">${name}</strong>
    `;

    if (msg.reasoningContent) {
      html += `
        <div style="margin-bottom: 10px; padding: 10px; background: #fff8e6; border-left: 4px solid #ffcc00; font-size: 0.9em; color: #666;">
          <strong>Thinking:</strong><br/>
          ${msg.reasoningContent.replace(/\n/g, '<br/>')}
        </div>
      `;
    }

    // Basic markdown to HTML for PDF (just bold/italic/code for simplicity in this vanilla string approach)
    let contentHtml = msg.content
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background:#2d2d2d;color:#ccc;padding:10px;border-radius:4px;overflow-x:auto;"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code style="background:#eaeaea;padding:2px 4px;border-radius:3px;">$1</code>');

    html += `<div>${contentHtml}</div></div>`;
  }

  element.innerHTML = html;

  const opt = {
    margin:       10,
    filename:     `${title || 'chat'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().set(opt as any).from(element).save();
}
