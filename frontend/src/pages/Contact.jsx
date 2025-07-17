import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-content">
          <h1 className="page-title">Contact Us</h1>
          <div className="contact-info">
            <div className="contact-item">
              <strong>Email:</strong> support@zootel.shop
            </div>
            <div className="contact-item">
              <strong>Phone:</strong> +1 (555) 123-4567
            </div>
            <div className="contact-item">
              <strong>Address:</strong> 123 Pet Street, Animal City, AC 12345
            </div>
            <div className="contact-item">
              <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 