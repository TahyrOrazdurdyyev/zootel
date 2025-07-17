import React from 'react';
import { Link } from 'react-router-dom';
import './ZootelBusiness.css';

const ZootelBusiness = () => {
  return (
    <div className="zootel-business-page">
      {/* Hero Section */}
      <section className="business-hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Zootel Business App</h1>
              <p className="hero-subtitle">
                Comprehensive pet care business management platform
              </p>
              <p className="hero-description">
                The future of pet care business management is here. Zootel Business App will provide 
                comprehensive tools for pet service companies and independent freelancers to manage 
                their operations, employees, and customer relationships efficiently.
              </p>
              
              <div className="cta-buttons">
                <Link to="/signup" className="cta-btn primary">
                  Start Building Your Business
                </Link>
                <Link to="/pricing" className="cta-btn secondary">
                  View Pricing Plans
                </Link>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="header-controls">
                    <div className="control red"></div>
                    <div className="control yellow"></div>
                    <div className="control green"></div>
                  </div>
                  <div className="header-title">Zootel Business Dashboard</div>
                </div>
                <div className="mockup-content">
                  <div className="sidebar">
                    <div className="nav-item active">📊 Dashboard</div>
                    <div className="nav-item">👥 Employees</div>
                    <div className="nav-item">📅 Bookings</div>
                    <div className="nav-item">💬 Messages</div>
                  </div>
                  <div className="main-content">
                    <div className="stat-cards">
                      <div className="stat-card">
                        <div className="stat-number">142</div>
                        <div className="stat-label">Active Bookings</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-number">$12,450</div>
                        <div className="stat-label">Monthly Revenue</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences Section */}
      <section className="audiences-section">
        <div className="container">
          <h2 className="section-title">Built for Pet Care Professionals</h2>
          
          <div className="audiences-grid">
            {/* Freelancers */}
            <div className="audience-card">
              <div className="audience-icon">👤</div>
              <h3>Independent Freelancers</h3>
              <p className="audience-description">
                Perfect for individual pet care providers who want to grow their business and 
                streamline their operations.
              </p>
              
              <div className="features-list">
                <h4>What you can do:</h4>
                <ul>
                  <li>✅ Create and manage your service offerings</li>
                  <li>✅ Set your own pricing and availability</li>
                  <li>✅ Handle bookings and scheduling</li>
                  <li>✅ Communicate directly with pet owners</li>
                  <li>✅ Track earnings and business metrics</li>
                  <li>✅ Build your professional profile and reputation</li>
                </ul>
              </div>
            </div>

            {/* Companies */}
            <div className="audience-card">
              <div className="audience-icon">🏢</div>
              <h3>Pet Service Companies</h3>
              <p className="audience-description">
                Comprehensive business management tools for pet care companies of all sizes, 
                from small teams to large enterprises.
              </p>
              
              <div className="features-list">
                <h4>What you can do:</h4>
                <ul>
                  <li>✅ Create and manage employee accounts</li>
                  <li>✅ Assign tasks and manage employee workflows</li>
                  <li>✅ Monitor employee performance and productivity</li>
                  <li>✅ Centralized customer communication hub</li>
                  <li>✅ Advanced analytics and reporting</li>
                  <li>✅ Multi-location business management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employee Management Features */}
      <section className="employee-features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Advanced Employee Management</h2>
            <p className="section-subtitle">
              Empower your team with cutting-edge tools and seamless communication
            </p>
          </div>
          
          <div className="employee-features-grid">
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <h3>Employee Account Creation</h3>
              <p>
                Easily create and manage employee accounts with role-based permissions. 
                Each employee gets their own dashboard to manage their tasks and schedule.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <h3>Task Assignment & Management</h3>
              <p>
                Assign specific bookings and tasks to employees, track progress in real-time, 
                and ensure optimal workload distribution across your team.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <h3>Real-time Notifications</h3>
              <p>
                Employees receive instant notifications about new assignments, schedule changes, 
                urgent messages, and important updates through the app.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <h3>Customer Chat Integration</h3>
              <p>
                Employees can chat directly with customers, share updates, send photos, 
                and provide exceptional customer service through integrated messaging.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Performance Analytics</h3>
              <p>
                Track individual employee performance, customer satisfaction ratings, 
                and productivity metrics to optimize your business operations.
              </p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3>Mobile Employee App</h3>
              <p>
                Dedicated mobile application for employees to manage their schedule, 
                view assignments, communicate with customers, and update task status on the go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">Why Choose Zootel Business?</h2>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🚀</div>
              <h3>Streamlined Operations</h3>
              <p>
                Automate routine tasks, optimize scheduling, and reduce administrative overhead 
                to focus on what matters most - providing excellent pet care.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Increased Revenue</h3>
              <p>
                Maximize your earning potential with dynamic pricing tools, 
                efficient resource allocation, and data-driven business insights.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">⭐</div>
              <h3>Enhanced Customer Experience</h3>
              <p>
                Provide exceptional service with seamless communication tools, 
                real-time updates, and professional service delivery.
              </p>
            </div>
            
            <div className="benefit-card">
              <div className="benefit-icon">📈</div>
              <h3>Business Growth</h3>
              <p>
                Scale your business confidently with robust management tools, 
                performance analytics, and scalable infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="coming-soon-banner">
        <div className="container">
          <div className="banner-content">
            <h2>🚀 Launch Coming Soon</h2>
            <p>
              We're putting the finishing touches on Zootel Business App. 
              While you wait, start building your presence on our platform today!
            </p>
            <div className="banner-actions">
              <Link to="/signup" className="banner-btn primary">
                Get Started Now
              </Link>
              <Link to="/marketplace" className="banner-btn secondary">
                Explore Marketplace
              </Link>
            </div>
          </div>
          
          <div className="banner-note">
            <p>
              <strong>Note:</strong> This information describes our upcoming Zootel Business App features. 
              Current users can access basic business management tools through our existing dashboard. 
              The enhanced features mentioned above will be available in the upcoming app release.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ZootelBusiness; 