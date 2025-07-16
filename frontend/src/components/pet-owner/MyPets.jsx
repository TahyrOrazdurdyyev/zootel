import React from 'react';

const MyPets = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#4A90E2', marginBottom: '1rem' }}>My Pets</h2>
      <p style={{ color: '#6c757d' }}>Pet management coming soon...</p>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
        <p>Add, edit, and manage your pet profiles including medical records, photos, and preferences.</p>
      </div>
    </div>
  );
};

export default MyPets; 