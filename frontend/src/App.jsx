import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Pricing from './pages/Pricing';
import ZootelApp from './pages/ZootelApp';
import ZootelBusiness from './pages/ZootelBusiness';
import About from './pages/About';
import Contact from './pages/Contact';
import Support from './pages/Support';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CompanyDashboard from './pages/CompanyDashboard';
import PetOwnerDashboard from './pages/PetOwnerDashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CompanyDescription from './pages/CompanyDescription';
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
const Careers = () => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1 style={{ color: '#FFA500' }}>Careers</h1>
    <p>Join the Zootel team! Careers page coming soon...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
        <Routes>
          {/* Company Dashboard - No layout wrapper */}
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          
          {/* Pet Owner Dashboard - No layout wrapper */}
          <Route path="/pet-owner/dashboard" element={<PetOwnerDashboard />} />
          
          {/* Superadmin Dashboard - No layout wrapper */}
          <Route path="/admin/dashboard" element={<SuperadminDashboard />} />
          
          {/* All other routes with layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/zootel-app" element={<ZootelApp />} />
                <Route path="/zootel-business" element={<ZootelBusiness />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/support" element={<Support />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/email-verification" element={<EmailVerification />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                {/* Placeholder routes for future implementation */}
                <Route path="/booking/:serviceId" element={
                  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <h1 style={{ color: '#FFA500' }}>Booking</h1>
                    <p>Booking page coming soon...</p>
                  </div>
                } />
                <Route path="/company/:companyId" element={<CompanyDescription />} />

                {/* 404 Page */}
                <Route path="*" element={
                  <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <h1 style={{ color: '#FFA500' }}>404 - Page Not Found</h1>
                    <p>The page you&apos;re looking for doesn&apos;t exist.</p>
                  </div>
                } />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App; 