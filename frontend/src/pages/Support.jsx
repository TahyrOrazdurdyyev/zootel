import React from 'react';

const Support = () => {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: '#FFA500', fontSize: '2.5rem', marginBottom: '2rem' }}>Support Center</h1>
      <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#666', marginBottom: '2rem' }}>
        Need help? We're here to assist you with any questions about Zootel.
      </p>
      <div style={{ textAlign: 'left', fontSize: '1rem', lineHeight: '1.6', color: '#666' }}>
        <h3 style={{ color: '#FFA500' }}>Common Topics:</h3>
        <ul>
          <li>How to book a service</li>
          <li>Managing your pet profile</li>
          <li>Payment and billing</li>
          <li>Service provider guidelines</li>
        </ul>
      </div>
    </div>
  );
};

export default Support; 