import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeFirebase, seedSuperadmin } from './config/firebase.js';
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import servicesRoutes from './routes/services.js';
import bookingsRoutes from './routes/bookings.js';
import analyticsRoutes from './routes/analytics.js';
import petOwnersRoutes from './routes/pet-owners.js';
import superadminRoutes from './routes/superadmin.js';
import { verifyToken, optionalAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://zootel.shop',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Zootel API is running',
    timestamp: new Date().toISOString(),
    firebase: 'initialized'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Pet company dashboard routes
app.use('/api/companies', companiesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Pet owner routes
app.use('/api/pet-owners', petOwnersRoutes);

// Superadmin routes
app.use('/api/superadmin', superadminRoutes);

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected route',
    user: req.user,
  });
});

// Public route with optional authentication
app.get('/api/public', optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: 'This is a public route',
    user: req.user || null,
    authenticated: !!req.user,
  });
});

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Zootel API endpoints',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      companies: '/api/companies/*',
      services: '/api/services/*',
      bookings: '/api/bookings/*',
      analytics: '/api/analytics/*',
      petOwners: '/api/pet-owners/*',
      superadmin: '/api/superadmin/*',
      protected: '/api/protected',
      public: '/api/public',
    }
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// Start server and seed superadmin
const startServer = async () => {
  try {
    // Seed superadmin user
    await seedSuperadmin();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log('🔥 Firebase Admin SDK ready');
      console.log('👑 Superadmin seeding completed');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 