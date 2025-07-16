import React from 'react';

const BookingsManagement = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#FFA500', marginBottom: '1rem' }}>Bookings Management</h2>
      <p style={{ color: '#6c757d' }}>Manage customer bookings coming soon...</p>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
        <p>View, confirm, and manage all customer bookings and appointments.</p>
      </div>
    </div>
  );
};

export default BookingsManagement; 