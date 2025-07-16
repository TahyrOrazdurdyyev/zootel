import React from 'react';

const SystemSettings = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#BB86FC', marginBottom: '1rem' }}>System Settings</h2>
      <p style={{ color: '#b3b3b3' }}>System settings coming soon...</p>
      <div style={{ 
        background: 'rgba(124, 77, 255, 0.1)', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #7C4DFF'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
        <p style={{ color: '#ffffff' }}>Configure platform settings, API limits, security policies, and system maintenance.</p>
      </div>
    </div>
  );
};

export default SystemSettings; 