import React from 'react';

const BrowseServices = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#4A90E2', marginBottom: '1rem' }}>Browse Services</h2>
      <p style={{ color: '#6c757d' }}>Service browsing coming soon...</p>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <p>Discover and book pet services from local providers. Filter by location, price, and ratings.</p>
      </div>
    </div>
  );
};

export default BrowseServices; 