import React, { Suspense } from 'react';
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
import OnboardingPage from './pages/auth/OnboardingPage';
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

// Lazy load heavy admin pages
const PaymentSettings = React.lazy(() => import('./pages/admin/PaymentSettings'));
const PlanSettings = React.lazy(() => import('./pages/admin/PlanSettings'));
const AnalyticsPage = React.lazy(() => import('./pages/admin/AnalyticsPage'));
const CompaniesManagement = React.lazy(() => import('./pages/admin/CompaniesManagement'));
const CurrencyManagement = React.lazy(() => import('./pages/admin/CurrencyManagement'));
const PromptsManagement = React.lazy(() => import('./pages/admin/PromptsManagement'));
const ServiceCategoriesManagement = React.lazy(() => import('./pages/admin/ServiceCategoriesManagement'));
const BusinessTypesManagement = React.lazy(() => import('./pages/admin/BusinessTypesManagement'));
const CareersManagement = React.lazy(() => import('./pages/admin/CareersManagement'));
const PressManagement = React.lazy(() => import('./pages/admin/PressManagement'));
const BlogManagement = React.lazy(() => import('./pages/admin/BlogManagement'));
const AIPromptsCustomization = React.lazy(() => import('./pages/company/AIPromptsCustomization'));
import BusinessLandingPage from './pages/BusinessLandingPage';
import CareersPage from './pages/CareersPage';
import PressPage from './pages/PressPage';
import BlogPage from './pages/BlogPage';

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
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/business-register" element={<BusinessRegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/shop" element={<MarketplacePage />} />
              <Route path="/services" element={<MarketplacePage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/companies/:companyId" element={<CompanyPublicPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/blog" element={<BlogPage />} />
              
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
                    <Route path="/service-categories" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <ServiceCategoriesManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/business-types" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <BusinessTypesManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/careers" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <CareersManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/press" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <PressManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/blog" element={
                      <ProtectedRoute requiredRole="super_admin">
                        <BlogManagement />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
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