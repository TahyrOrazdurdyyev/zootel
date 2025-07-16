import React from 'react';

const TermsOfService = () => {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#FFA500', fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Terms of Service</h1>
      <div style={{ fontSize: '1rem', lineHeight: '1.6', color: '#666' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h3 style={{ color: '#FFA500' }}>Acceptance of Terms</h3>
        <p>By accessing and using Zootel, you accept and agree to be bound by the terms and provision of this agreement.</p>
        <h3 style={{ color: '#FFA500' }}>Use License</h3>
        <p>Permission is granted to temporarily use Zootel for personal, non-commercial transitory viewing only.</p>
        <h3 style={{ color: '#FFA500' }}>Disclaimer</h3>
        <p>The materials on Zootel are provided on an 'as is' basis. Zootel makes no warranties, expressed or implied.</p>
      </div>
    </div>
  );
};

export default TermsOfService; 