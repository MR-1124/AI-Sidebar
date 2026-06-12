import React from 'react';
import { Widget } from '@typeform/embed-react';

export function FeedbackSettings() {
  // Use the actual Typeform ID provided by the user
  const typeformId = 'YV0TyKFO';

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-6">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>Feedback & Support</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          We would love to hear your thoughts on AI Sidebar! Have a feature request, found a bug, or just want to say hi? Fill out the form below.
        </p>
      </div>

      <div 
        style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}
      >
        <Widget 
          id={typeformId} 
          style={{ width: '100%', height: '100%' }}
          className="my-typeform-widget"
          transitiveSearchParams={true}
          hideHeaders={true}
          hideFooter={true}
          opacity={0}
          iframeProps={{ title: 'AI Sidebar Feedback Form' }}
        />
      </div>
    </div>
  );
}
