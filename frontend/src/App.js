import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import LayoutRouter from './components/layouts/LayoutRouter';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BusinessRegisterPage from './pages/auth/BusinessRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import BusinessPage from './pages/BusinessPage';
import CompanyPublicPage from './pages/CompanyPublicPage';
import CompaniesPage from './pages/CompaniesPage';
import BookingPage from './pages/BookingPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';

// Admin pages
import PaymentSettings from './pages/admin/PaymentSettings';
import PlanSettings from './pages/admin/PlanSettings';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import CompaniesManagement from './pages/admin/CompaniesManagement';
import CurrencyManagement from './pages/admin/CurrencyManagement';
import PromptsManagement from './pages/admin/PromptsManagement';
import AIPromptsCustomization from './pages/company/AIPromptsCustomization';
import BusinessLandingPage from './pages/BusinessLandingPage';

// Payment pages
import CryptoPaymentPage from './pages/payment/CryptoPaymentPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import PaymentFailedPage from './pages/payment/PaymentFailedPage';

// Company pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyAnalyticsPage from './pages/company/CompanyAnalyticsPage';
import EmployeeChatPage from './pages/company/EmployeeChatPage';
import ServicesManagementPage from './pages/company/ServicesManagementPage';
import AddonManagementPage from './pages/company/AddonManagementPage';
import InventoryPage from './pages/company/InventoryPage';

import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';

// Import theme styles
import './styles/themes.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <LayoutRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/business-register" element={<BusinessRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/shop" element={<MarketplacePage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/company/:companyId" element={<CompanyPublicPage />} />
              
              {/* Payment Routes */}
              <Route path="/payment/crypto/:paymentId" element={<CryptoPaymentPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/failed" element={<PaymentFailedPage />} />
              
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
              

              <Route path="/company/*" element={
                <ProtectedRoute requiredRole="company_owner">
                  <Routes>
                    <Route path="/" element={<CompanyDashboard />} />
                    <Route path="/analytics" element={<CompanyAnalyticsPage />} />
                    <Route path="/chat" element={<EmployeeChatPage />} />
                    <Route path="/services" element={<ServicesManagementPage />} />
                    <Route path="/addons" element={<AddonManagementPage />} />
                    <Route path="/ai-prompts" element={<AIPromptsCustomization />} />
                    <Route path="/inventory" element={<InventoryPage />} />
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
                    <Route path="/companies" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <CompaniesManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/currencies" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <CurrencyManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/prompts" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <PromptsManagement />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </LayoutRouter>
        </CartProvider>
        </CurrencyProvider>
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
      </AuthProvider>
    </Router>
  );
}

export default App; 