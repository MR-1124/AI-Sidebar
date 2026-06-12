import React from 'react';
import { Widget } from '@typeform/embed-react';

export function FeedbackSettings() {
  // We use a placeholder Typeform ID here. 
  // In a real application, you would load this from an environment variable or settings.
  const typeformId = 'c7a4m0W5'; // Example Typeform ID

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-6">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Feedback & Support</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          We would love to hear your thoughts on AI Sidebar! Have a feature request, found a bug, or just want to say hi? Fill out the form below.
        </p>
      </div>

      <div 
        className="flex-1 w-full bg-white dark:bg-[#1e1e24] rounded-xl overflow-hidden border border-[var(--border-color)] shadow-sm"
        style={{ minHeight: '500px' }}
      >
        <Widget 
          id={typeformId} 
          style={{ width: '100%', height: '100%' }} 
          className="my-typeform-widget"
          transitiveSearchParams={true}
          iframeProps={{ title: 'AI Sidebar Feedback Form' }}
        />
      </div>
    </div>
  );
}
