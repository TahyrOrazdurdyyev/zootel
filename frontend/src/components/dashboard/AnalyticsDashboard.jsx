import React from 'react';

const AnalyticsDashboard = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#FFA500', marginBottom: '1rem' }}>Analytics Dashboard</h2>
      <p style={{ color: '#6c757d' }}>Business analytics and reports coming soon...</p>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
        <p>View detailed analytics, revenue reports, customer insights, and business performance metrics.</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 