import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/common/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import BusinessPage from './pages/BusinessPage';
import BookingPage from './pages/BookingPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';

// Admin pages
import PaymentSettings from './pages/admin/PaymentSettings';
import PlanSettings from './pages/admin/PlanSettings';
import AnalyticsPage from './pages/admin/AnalyticsPage';

// Company pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyAnalyticsPage from './pages/company/CompanyAnalyticsPage';
import EmployeeChatPage from './pages/company/EmployeeChatPage';

import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/business" element={<BusinessPage />} />
              
              {/* Protected Routes */}
              <Route path="/booking/:companyId?" element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/chat/:chatId?" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              
              {/* Company Dashboard */}
              <Route path="/company/*" element={
                <ProtectedRoute requiredRole="company_owner">
                  <Routes>
                    <Route path="/" element={<CompanyDashboard />} />
                    <Route path="/analytics" element={<CompanyAnalyticsPage />} />
                    <Route path="/chat" element={<EmployeeChatPage />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Admin Dashboard */}
              <Route path="/admin/*" element={
                <ProtectedRoute requiredRole="super_admin">
                  <Routes>
                    <Route path="/" element={<div>Admin Dashboard</div>} />
                    <Route path="/payment-settings" element={<PaymentSettings />} />
                    <Route path="/plan-settings" element={<PlanSettings />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: '',
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}

export default App; 