import React from 'react';

const Contact = () => {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: '#FFA500', fontSize: '2.5rem', marginBottom: '2rem' }}>Contact Us</h1>
      <div style={{ textAlign: 'left', fontSize: '1.1rem', lineHeight: '1.6', color: '#666' }}>
        <p><strong>Email:</strong> support@zootel.shop</p>
        <p><strong>Phone:</strong> +1 (555) 123-4567</p>
        <p><strong>Address:</strong> 123 Pet Street, Animal City, AC 12345</p>
        <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM</p>
      </div>
    </div>
  );
};

export default Contact; 