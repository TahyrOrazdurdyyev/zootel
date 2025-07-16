import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#FFA500', fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Privacy Policy</h1>
      <div style={{ fontSize: '1rem', lineHeight: '1.6', color: '#666' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h3 style={{ color: '#FFA500' }}>Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us.</p>
        <h3 style={{ color: '#FFA500' }}>How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services.</p>
        <h3 style={{ color: '#FFA500' }}>Information Sharing</h3>
        <p>We do not sell, trade, or rent your personal information to third parties.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 