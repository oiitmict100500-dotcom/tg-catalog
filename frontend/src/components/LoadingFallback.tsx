import React from 'react';

export default function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>TG Catalog</h1>
      <p style={{ color: '#666' }}>Загрузка...</p>
    </div>
  );
}

