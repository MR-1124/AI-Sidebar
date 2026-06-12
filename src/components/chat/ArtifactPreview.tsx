import React, { useMemo } from 'react';

interface ArtifactPreviewProps {
  code: string;
  language: string;
}

export function ArtifactPreview({ code, language }: ArtifactPreviewProps) {
  const srcDoc = useMemo(() => {
    const isReact = ['jsx', 'tsx', 'react'].includes(language.toLowerCase());
    
    if (isReact) {
      // Clean the code to handle ES module exports in a standalone script
      // Remove "export default" to allow local rendering
      const cleanedCode = code
        .replace(/export default /g, '')
        .replace(/export /g, '');

      return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: white; color: black; min-height: 100vh; }
      #root { padding: 16px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      const { useState, useEffect, useRef, useMemo, useCallback } = React;
      
      ${cleanedCode}
      
      // Auto-render logic
      try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        if (typeof App !== 'undefined') {
           root.render(React.createElement(App));
        } else if (typeof Component !== 'undefined') {
           root.render(React.createElement(Component));
        } else {
           // Fallback: search window for functions that look like components (PascalCase)
           const componentNames = Object.keys(window).filter(k => 
             typeof window[k] === 'function' && 
             /^[A-Z]/.test(k) && 
             k !== 'App' && k !== 'Component'
           );
           if (componentNames.length > 0) {
             root.render(React.createElement(window[componentNames[componentNames.length - 1]]));
           } else {
             document.getElementById('root').innerHTML = '<div style="color:red; font-family:sans-serif;">Error: Could not find an App component to render. Make sure your component is named App.</div>';
           }
        }
        
        // Initialize lucide icons if used outside react components
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
      } catch (err) {
        document.getElementById('root').innerHTML = '<div style="color:red; font-family:sans-serif;">Render Error: ' + err.message + '</div>';
      }
    </script>
  </body>
</html>
      `;
    }

    // Default for HTML/CSS/JS
    const isHTML = code.toLowerCase().includes('<!doctype html>') || code.toLowerCase().includes('<html>') || language.toLowerCase() === 'html';
    if (!isHTML && ['js', 'javascript'].includes(language.toLowerCase())) {
        return `
<!DOCTYPE html>
<html>
  <head>
    <style>body { font-family: system-ui, sans-serif; padding: 16px; margin: 0; background: white; color: black; }</style>
  </head>
  <body>
    <div id="output">Check console for output</div>
    <script>
      ${code}
    </script>
  </body>
</html>
        `;
    }

    // Default: return raw code (assumes it's HTML)
    return code;
  }, [code, language]);

  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      background: '#fff', 
      borderTop: '1px solid var(--border)',
      borderBottomLeftRadius: 'var(--radius-md)',
      borderBottomRightRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }}>
      <iframe
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#fff'
        }}
        title="Artifact Preview"
      />
    </div>
  );
}
