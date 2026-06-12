// ─────────────────────────────────────────────────────────────
// MessageInput — Chat input area with send/stop controls
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Command, Globe, Search, Paperclip, X, FileText, Image as ImageIcon, Camera, Code, Mic, MicOff } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { usePromptStore } from '../../stores/prompt-store';
import { useUIStore } from '../../stores/ui-store';

interface MessageInputProps {
  onSend: (content: string, attachments?: Array<{ type: 'image'|'file', data: string, name: string, mimeType: string }>) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, onStop, isGenerating, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Array<{ type: 'image'|'file', data: string, name: string, mimeType: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendOnEnter = useSettingsStore(s => s.settings.general.sendOnEnter);
  
  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }


    try {
      // Explicitly request microphone permission to trigger the browser prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream tracks immediately, we just needed the permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err: any) {
      console.error('Microphone permission denied', err);
      
      // Chrome extension side panels cannot natively show permission prompts.
      // If it fails, we must open the extension in a full browser tab to request it.
      if (confirm('Microphone permission is required for voice input.\n\nDue to browser limitations, you must grant this permission in a full tab. Click OK to open a full tab where you can click the Mic icon again to grant access.')) {
        chrome.tabs.create({ url: chrome.runtime.getURL('src/sidepanel/index.html') });
      }
      
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Prompts logic
  const prompts = usePromptStore(s => s.prompts);
  const { includePageContext, setIncludePageContext, webSearchEnabled, setWebSearchEnabled } = useUIStore();
  const [showPrompts, setShowPrompts] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredPrompts = prompts.filter(p => 
    p.name.toLowerCase().includes(promptSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(promptSearch.toLowerCase())
  ).slice(0, 5);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Listen for Context Menu actions
  useEffect(() => {
    const handleContextAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt: string }>;
      const { prompt } = customEvent.detail;
      if (prompt && !isGenerating && !disabled) {
        // We set the input to ensure it is visible briefly if we want, but it's better to just send it
        onSend(prompt);
      }
    };

    window.addEventListener('aiside-context-action', handleContextAction);
    return () => window.removeEventListener('aiside-context-action', handleContextAction);
  }, [isGenerating, disabled, onSend]);

  // Listen for global file drop events
  useEffect(() => {
    const handleFileDrop = (e: Event) => {
      const customEvent = e as CustomEvent<{ files: File[] }>;
      if (customEvent.detail && customEvent.detail.files) {
        customEvent.detail.files.forEach(processFile);
      }
    };
    window.addEventListener('aiside-file-drop', handleFileDrop);
    return () => window.removeEventListener('aiside-file-drop', handleFileDrop);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Check for slash command
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    
    // Match / followed by word characters at the end of textBeforeCursor
    const match = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (match) {
      setShowPrompts(true);
      setPromptSearch(match[1]);
      setSelectedIndex(0);
    } else {
      setShowPrompts(false);
    }
  };

  const insertPrompt = (content: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = input.slice(0, cursorPosition);
    const textAfterCursor = input.slice(cursorPosition);
    
    // Replace the /command with the prompt content
    const match = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (match) {
      const startIdx = match.index === 0 ? 0 : match.index! + 1; // +1 to skip the leading space
      const newTextBefore = textBeforeCursor.slice(0, startIdx);
      setInput(newTextBefore + content + textAfterCursor);
    } else {
      setInput(input + content);
    }
    
    setShowPrompts(false);
    textareaRef.current?.focus();
  };

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isGenerating || disabled) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
    setShowPrompts(false);
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, attachments, isGenerating, disabled, onSend]);

  const processFile = async (file: File) => {
    if (file.type === 'application/pdf') {
      setIsExtractingPdf(true);
      try {
        const { extractPdfText } = await import('../../lib/pdf');
        const text = await extractPdfText(file);
        setAttachments(prev => [...prev, { type: 'file', data: text, name: file.name, mimeType: file.type }]);
      } catch (err: any) {
        console.error("Failed to extract PDF:", err);
        alert("Failed to read PDF file.");
      } finally {
        setIsExtractingPdf(false);
      }
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setAttachments(prev => [...prev, { type: 'image', data: e.target!.result as string, name: file.name, mimeType: file.type }]);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setAttachments(prev => [...prev, { type: 'file', data: e.target!.result as string, name: file.name, mimeType: file.type }]);
        }
      };
      reader.readAsText(file);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(processFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCaptureTab = () => {
    if (chrome && chrome.tabs && chrome.tabs.captureVisibleTab) {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to capture tab:", chrome.runtime.lastError.message);
          return;
        }
        if (dataUrl) {
          setAttachments(prev => [...prev, {
            type: 'image',
            name: 'Screenshot.png',
            mimeType: 'image/png',
            data: dataUrl
          }]);
        }
      });
    } else {
      console.warn("Capture Visible Tab API is not available.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showPrompts && filteredPrompts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredPrompts.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredPrompts.length) % filteredPrompts.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertPrompt(filteredPrompts[selectedIndex].content);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowPrompts(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && sendOnEnter) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, sendOnEnter, showPrompts, filteredPrompts, selectedIndex]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = Array.from(e.clipboardData.items);
      let handled = false;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            handled = true;
          }
        }
      }
    }
  }, []);

  return (
    <div style={{
      padding: '12px 16px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      position: 'relative'
    }}>
        {/* PDF Extraction Loading Overlay */}
        {isExtractingPdf && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            borderRadius: 'var(--radius-lg)',
            color: 'white',
            backdropFilter: 'blur(2px)',
          }}>
            <div className="animate-spin" style={{ marginBottom: 8 }}>
              <Globe size={24} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Extracting PDF...</span>
          </div>
        )}

      {/* Prompt Overlay */}
      {showPrompts && filteredPrompts.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 16,
          right: 16,
          marginBottom: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '8px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}>
            Select a prompt (use arrows, press Enter)
          </div>
          {filteredPrompts.map((prompt, idx) => (
            <button
              key={prompt.id}
              onClick={() => insertPrompt(prompt.content)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 12px',
                background: selectedIndex === idx ? 'var(--accent-subtle)' : 'transparent',
                border: 'none',
                borderBottom: idx < filteredPrompts.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: selectedIndex === idx ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                <Command size={12} /> /{prompt.name}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                  {prompt.category}
                </span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}>
                {prompt.content}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: isDragging ? 'var(--bg-hover)' : 'var(--bg-input)',
        border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '8px 12px',
        transition: 'all var(--transition-fast)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onFocus={(e) => {
        const div = e.currentTarget;
        if (!isDragging) {
          div.style.borderColor = 'var(--border-focus)';
          div.style.boxShadow = 'var(--shadow-glow)';
        }
      }}
      onBlur={(e) => {
        const div = e.currentTarget;
        if (!div.contains(e.relatedTarget as Node) && !isDragging) {
          div.style.borderColor = 'var(--border)';
          div.style.boxShadow = 'none';
        }
      }}
      >
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            flexWrap: 'nowrap', 
            overflowX: 'auto', 
            paddingBottom: 12, 
            marginBottom: 8,
            borderBottom: '1px solid var(--border)',
            scrollbarWidth: 'thin'
          }}>
            {attachments.map((att, idx) => (
              <div key={idx} style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                flexShrink: 0,
                width: 64,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {att.type === 'image' ? (
                  <img src={att.data} alt="preview" style={{ width: '100%', height: 48, objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: 48, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={24} className="text-muted" />
                  </div>
                )}
                <div style={{ 
                  width: '100%', 
                  padding: '4px', 
                  fontSize: '0.65rem', 
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border)'
                }}>
                  {att.name}
                </div>
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'var(--error)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  className="attachment-remove-btn"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <style>{`.attachment-remove-btn { opacity: 1 !important; }`}</style>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*,.txt,.csv,.json,.md"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Paperclip size={18} />
          </button>

          <button
            onClick={handleCaptureTab}
            title="Capture visible tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Camera size={18} />
          </button>

          <button
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Start voice input"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              color: isListening ? 'var(--error)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if(!isListening) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { if(!isListening) e.currentTarget.style.background = 'transparent'; }}
          >
            {isListening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
          </button>

          {/* Textarea */}
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled || isExtractingPdf}
            placeholder={disabled ? "Configure a provider in Settings to start chatting..." : (showPrompts ? "Type a prompt command..." : "Type a message or paste an image...")}
            rows={1}
            style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            resize: 'none',
            maxHeight: 200,
            padding: '4px 0',
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setIncludePageContext(!includePageContext)}
            title={includePageContext ? "Page Context Included" : "Include Page Context"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: includePageContext ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Code size={16} />
          </button>

          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            title={webSearchEnabled ? "Web Search Enabled" : "Enable Web Search"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: webSearchEnabled ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Globe size={16} />
          </button>

          {isGenerating ? (
            <button
              onClick={onStop}
              title="Stop generation (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: 'var(--error)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Square size={14} fill="white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || disabled}
              title="Send message (Enter)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: (input.trim() || attachments.length > 0) && !disabled ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: (input.trim() || attachments.length > 0) && !disabled ? 'white' : 'var(--text-muted)',
                cursor: (input.trim() || attachments.length > 0) && !disabled ? 'pointer' : 'default',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if ((input.trim() || attachments.length > 0) && !disabled) {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = (input.trim() || attachments.length > 0) && !disabled
                  ? 'var(--accent)'
                  : 'var(--bg-tertiary)';
              }}
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>

      {/* Hint text */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        padding: '0 4px',
      }}>
        <span>
          {sendOnEnter ? 'Enter to send, Shift+Enter for newline' : 'Shift+Enter to send'}
        </span>
      </div>
    </div>
  );
}
