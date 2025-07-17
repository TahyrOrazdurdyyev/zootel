import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/companies/profile - Get company profile
router.get('/profile', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    
    // Get company profile from database
    const connection = await pool.getConnection();
    
    try {
      // Get company details
      const [companyRows] = await connection.execute(
        'SELECT * FROM companies WHERE id = ?',
        [companyId]
      );
      
      let companyProfile;
      
      if (companyRows.length === 0) {
        // Company doesn't exist in database yet - create new profile
        const defaultBusinessHours = JSON.stringify({
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { closed: true },
          sunday: { closed: true }
        });
        
        await connection.execute(
          `INSERT INTO companies (id, name, email, businessHours, verified, subscriptionPlan) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [companyId, '', req.user.email, defaultBusinessHours, false, 'basic']
        );
        
        companyProfile = {
          id: companyId,
          name: '',
          email: req.user.email,
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          description: '',
          businessHours: JSON.parse(defaultBusinessHours),
          logoUrl: '',
          verified: false,
          subscriptionPlan: 'basic',
          subscriptionStatus: 'active',
          totalBookings: 0,
          rating: 0.0,
          joinedDate: new Date().toISOString().split('T')[0]
        };
      } else {
        const company = companyRows[0];
        
        // Get booking count and rating
        const [bookingStats] = await connection.execute(
          'SELECT COUNT(*) as totalBookings FROM bookings WHERE companyId = ?',
          [companyId]
        );
        
        const [ratingStats] = await connection.execute(
          'SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews FROM reviews WHERE companyId = ?',
          [companyId]
        );
        
        companyProfile = {
          id: company.id,
          name: company.name || '',
          email: company.email,
          phone: company.phone || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          zipCode: company.zipCode || '',
          description: company.description || '',
          businessHours: typeof company.businessHours === 'string' ? JSON.parse(company.businessHours) : (company.businessHours || {}),
          logoUrl: company.logoUrl || '',
          verified: Boolean(company.verified),
          subscriptionPlan: company.subscriptionPlan || 'basic',
          subscriptionStatus: company.subscriptionStatus || 'active',
          totalBookings: bookingStats[0].totalBookings || 0,
          rating: parseFloat(ratingStats[0].avgRating) || 0.0,
          totalReviews: ratingStats[0].totalReviews || 0,
          joinedDate: company.createdAt ? company.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      }
      
      res.json({
        success: true,
        data: companyProfile
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting company profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get company profile'
    });
  }
});

// PUT /api/companies/profile - Update company profile
router.put('/profile', verifyToken, requireCompany, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      description,
      services,
      businessHours,
      images
    } = req.body;

    // TODO: Implement database update for company profile
    const updatedProfile = {
      id: req.user.uid,
      name: name || '',
      email: req.user.email,
      phone: phone || '',
      address: address || '',
      description: description || '',
      services: services || [],
      businessHours: businessHours || {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      images: images || [],
      verified: false,
      joinedDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

// GET /api/companies/analytics/overview - Get company analytics overview
router.get('/analytics/overview', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // Get total bookings
      const [totalBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ?',
        [companyId]
      );
      
      // Get monthly bookings
      const [monthlyBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ? AND createdAt >= ?',
        [companyId, startOfMonth]
      );
      
      // Get total revenue
      const [totalRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed"',
        [companyId]
      );
      
      // Get monthly revenue
      const [monthlyRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed" AND createdAt >= ?',
        [companyId, startOfMonth]
      );
      
      // Get average rating and total reviews
      const [ratingResult] = await connection.execute(
        'SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews FROM reviews WHERE companyId = ?',
        [companyId]
      );
      
      // Get new customers (customers who booked for the first time this month)
      const [newCustomersResult] = await connection.execute(
        `SELECT COUNT(DISTINCT petOwnerId) as total FROM bookings 
         WHERE companyId = ? AND createdAt >= ? 
         AND petOwnerId NOT IN (
           SELECT DISTINCT petOwnerId FROM bookings 
           WHERE companyId = ? AND createdAt < ?
         )`,
        [companyId, startOfMonth, companyId, startOfMonth]
      );
      
      // Get returning customers (customers who have booked before)
      const [returningCustomersResult] = await connection.execute(
        `SELECT COUNT(DISTINCT petOwnerId) as total FROM bookings 
         WHERE companyId = ? AND createdAt >= ? 
         AND petOwnerId IN (
           SELECT DISTINCT petOwnerId FROM bookings 
           WHERE companyId = ? AND createdAt < ?
         )`,
        [companyId, startOfMonth, companyId, startOfMonth]
      );
      
      const analytics = {
        totalBookings: totalBookingsResult[0].total || 0,
        monthlyBookings: monthlyBookingsResult[0].total || 0,
        totalRevenue: parseFloat(totalRevenueResult[0].total) || 0.00,
        monthlyRevenue: parseFloat(monthlyRevenueResult[0].total) || 0.00,
        averageRating: parseFloat(ratingResult[0].avgRating) || 0.0,
        totalReviews: ratingResult[0].totalReviews || 0,
        newCustomers: newCustomersResult[0].total || 0,
        returningCustomers: returningCustomersResult[0].total || 0
      };

      res.json({
        success: true,
        data: analytics
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting company analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get company analytics'
    });
  }
});

// GET /api/companies/customers - Get company customers
router.get('/customers', verifyToken, requireCompany, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // TODO: Implement database query to get company customers
    // For now, return empty array
    const customers = [];

    // Apply search filter (when implementing database queries)
    let filteredCustomers = customers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredCustomers.length / limit),
        totalCustomers: filteredCustomers.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get customers'
    });
  }
});

// GET /api/companies/dashboard-data - Get dashboard data for overview
router.get('/dashboard-data', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get recent bookings (last 10)
      const [recentBookingsResult] = await connection.execute(
        `SELECT 
           b.id, b.date, b.time, b.status, b.totalAmount as amount,
           po.name as petOwnerName,
           p.name as petName,
           s.name as serviceName
         FROM bookings b
         LEFT JOIN pet_owners po ON b.petOwnerId = po.id
         LEFT JOIN pets p ON b.petId = p.id
         LEFT JOIN services s ON b.serviceId = s.id
         WHERE b.companyId = ?
         ORDER BY b.createdAt DESC
         LIMIT 10`,
        [companyId]
      );

      // Get monthly earnings for the last 6 months
      const [monthlyEarningsResult] = await connection.execute(
        `SELECT 
           DATE_FORMAT(createdAt, '%Y-%m') as month,
           SUM(CASE WHEN status = 'completed' THEN totalAmount ELSE 0 END) as earnings
         FROM bookings 
         WHERE companyId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
         ORDER BY month`,
        [companyId]
      );

      const dashboardData = {
        recentBookings: recentBookingsResult.map(booking => ({
          id: booking.id,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          amount: parseFloat(booking.amount) || 0,
          petOwnerName: booking.petOwnerName || 'Unknown Customer',
          petName: booking.petName || 'Unknown Pet',
          serviceName: booking.serviceName || 'Unknown Service'
        })),
        monthlyEarnings: monthlyEarningsResult.map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
          earnings: parseFloat(item.earnings) || 0
        }))
      };

      res.json({
        success: true,
        data: dashboardData
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get dashboard data'
    });
  }
});

// GET /api/companies/stats - Get company stats for dashboard
router.get('/stats', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get total bookings
      const [totalBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ?',
        [companyId]
      );
      
      // Get monthly revenue
      const [monthlyRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed" AND createdAt >= ?',
        [companyId, startOfMonth]
      );
      
      // Get average rating and total reviews
      const [ratingResult] = await connection.execute(
        'SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews FROM reviews WHERE companyId = ?',
        [companyId]
      );
      
      // Get customer stats
      const [newCustomersResult] = await connection.execute(
        `SELECT COUNT(DISTINCT petOwnerId) as total FROM bookings 
         WHERE companyId = ? AND createdAt >= ?`,
        [companyId, startOfMonth]
      );
      
      const [returningCustomersResult] = await connection.execute(
        `SELECT COUNT(DISTINCT petOwnerId) as total FROM bookings 
         WHERE companyId = ? AND createdAt >= ? 
         AND petOwnerId IN (
           SELECT DISTINCT petOwnerId FROM bookings 
           WHERE companyId = ? AND createdAt < ?
         )`,
        [companyId, startOfMonth, companyId, startOfMonth]
      );

      const stats = {
        totalBookings: totalBookingsResult[0].total || 0,
        monthlyRevenue: parseFloat(monthlyRevenueResult[0].total) || 0.00,
        averageRating: parseFloat(ratingResult[0].avgRating) || 0.0,
        totalReviews: ratingResult[0].totalReviews || 0,
        newCustomers: newCustomersResult[0].total || 0,
        returningCustomers: returningCustomersResult[0].total || 0
      };

      res.json({
        success: true,
        data: stats
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting company stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get company stats'
    });
  }
});

export default router; 