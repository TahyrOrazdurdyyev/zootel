import React from 'react';
import './Support.css';

const Support = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-content">
          <h1 className="page-title">Support Center</h1>
          <p className="page-subtitle">
            Need help? We&apos;re here to assist you with any questions about Zootel.
          </p>
          <div className="support-topics">
            <h3 className="topics-title">Common Topics:</h3>
            <ul className="topics-list">
              <li>How to book a service</li>
              <li>Managing your pet profile</li>
              <li>Payment and billing</li>
              <li>Service provider guidelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support; 