import React from 'react';

const ServicesManagement = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#FFA500', marginBottom: '1rem' }}>Services Management</h2>
      <p style={{ color: '#6c757d' }}>Manage your pet services coming soon...</p>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐕</div>
        <p>Add, edit, and manage your pet services including pricing, descriptions, and availability.</p>
      </div>
    </div>
  );
};

export default ServicesManagement; 