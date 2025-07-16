import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Support from './pages/Support';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import './App.css';

// Layout wrapper component
const Layout = ({ children }) => {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

// Placeholder components for future implementation
const SignIn = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1 style={{ color: '#FFA500' }}>Sign In</h1>
    <p>Sign in page coming soon...</p>
  </div>
);

const SignUp = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1 style={{ color: '#FFA500' }}>Sign Up</h1>
    <p>Sign up page coming soon...</p>
  </div>
);

const Profile = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1 style={{ color: '#FFA500' }}>User Profile</h1>
    <p>Profile page coming soon...</p>
  </div>
);

const Settings = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1 style={{ color: '#FFA500' }}>Settings</h1>
    <p>Settings page coming soon...</p>
  </div>
);

const Careers = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1 style={{ color: '#FFA500' }}>Careers</h1>
    <p>Join the Zootel team! Careers page coming soon...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            {/* Placeholder routes for future implementation */}
            <Route path="/booking/:serviceId" element={
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#FFA500' }}>Booking</h1>
                <p>Booking page coming soon...</p>
              </div>
            } />
            <Route path="/company/:companyId" element={
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#FFA500' }}>Company Profile</h1>
                <p>Company profile page coming soon...</p>
              </div>
            } />
            <Route path="/admin/dashboard" element={
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#FFA500' }}>Admin Dashboard</h1>
                <p>Admin dashboard coming soon...</p>
              </div>
            } />
            <Route path="/company/dashboard" element={
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#FFA500' }}>Company Dashboard</h1>
                <p>Company dashboard coming soon...</p>
              </div>
            } />
            {/* 404 Page */}
            <Route path="*" element={
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#FFA500' }}>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
              </div>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App; 