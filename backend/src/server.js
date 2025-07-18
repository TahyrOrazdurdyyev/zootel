import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin, { initializeFirebase, seedSuperadmin } from './config/firebase.js';
import { testConnection, createDatabase, createTables, seedDemoData, migrateEmployeesTable, migrateCompaniesTable } from './config/database.js';
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import servicesRoutes from './routes/services.js';
import bookingsRoutes from './routes/bookings.js';
import employeesRoutes from './routes/employees.js';
import customersRoutes from './routes/customers.js';
import analyticsRoutes from './routes/analytics.js';
import petOwnersRoutes from './routes/pet-owners.js';
import superadminRoutes from './routes/superadmin.js';
import waitlistRoutes from './routes/waitlist.js';
import { verifyToken, optionalAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Zootel API is running',
    timestamp: new Date().toISOString(),
    firebase: 'initialized'
  });
});

// Set role endpoint for pending role assignment
app.post('/api/setRole', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    const uid = req.user.uid;

    if (!role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role is required',
      });
    }

    // Only allow specific roles
    const allowedRoles = ['pet_company', 'pet_owner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    // admin is imported at the top of the file
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role });

    res.json({
      success: true,
      role: role
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    res.status(500).json({
      error: 'Internal Server Error', 
      message: 'Failed to set user role',
    });
  }
});

// Subscription endpoint
app.get('/api/subscription', verifyToken, async (req, res) => {
  try {
    // For now, return basic subscription data
    // This can be expanded with real subscription logic later
    const subscriptionData = {
      plan: 'free',
      status: 'active',
      trialEndsAt: null,
      currentPeriodEnd: null,
      usage: {
        services: 0,
        employees: 0,
        bookingsThisMonth: 0
      }
    };

    res.json(subscriptionData);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch subscription data',
    });
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Waitlist routes (public)
app.use('/api/waitlist', waitlistRoutes);

// Pet company dashboard routes
app.use('/api/companies', companiesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/customers', customersRoutes);
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
      employees: '/api/employees/*',
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

// Start server and initialize all services
const startServer = async () => {
  try {
    console.log('🔧 Initializing Zootel services...');
    console.log('');
    
    // Initialize database
    console.log('📊 Setting up database...');
    let dbConnected = false;
    
    try {
      // First, try to create the database if it doesn't exist
      await createDatabase();
      
      // Then test the connection
      dbConnected = await testConnection();
      
      if (dbConnected) {
        // Create tables
        await createTables();
        
        // Run employee table migration
        await migrateEmployeesTable();
        
        // Run companies table migration  
        await migrateCompaniesTable();
        
        // Seed demo data
        await seedDemoData();
      }
    } catch (dbError) {
      console.warn('⚠️  Database initialization failed, continuing without database');
      console.warn('   Error:', dbError.message);
    }
    
    // Seed superadmin user
    console.log('👑 Setting up superadmin...');
    await seedSuperadmin();
    
    // Start the server
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ===============================================');
      console.log('🚀 Zootel API Server Started Successfully');
      console.log('🎉 ===============================================');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local URL: http://localhost:${PORT}/api`);
      console.log(`🌐 Production URL: https://api.zootel.shop/api`);
      console.log(`🔥 Firebase: ✅ Ready`);
      console.log(`🗄️  Database: ${dbConnected ? '✅ Connected' : '⚠️  Fallback Mode'}`);
      console.log('👑 Superadmin: ✅ Ready');
      console.log('===============================================');
      console.log('🎯 All systems operational!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 