import React from 'react';

const ProfileManagement = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#FFA500', marginBottom: '1rem' }}>Profile Management</h2>
      <p style={{ color: '#6c757d' }}>Company profile management coming soon...</p>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
        <p>Edit company information, business hours, contact details, and more.</p>
      </div>
    </div>
  );
};

export default ProfileManagement; 