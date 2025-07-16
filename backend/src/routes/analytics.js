import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/analytics/overview - Get comprehensive business overview
router.get('/overview', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // Get total and monthly revenue
      const [totalRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed"',
        [companyId]
      );
      
      const [monthlyRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed" AND createdAt >= ?',
        [companyId, startOfMonth]
      );
      
      const [yearlyRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed" AND createdAt >= ?',
        [companyId, startOfYear]
      );
      
      const [lastMonthRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed" AND createdAt >= ? AND createdAt <= ?',
        [companyId, startOfLastMonth, endOfLastMonth]
      );
      
      // Get booking stats
      const [totalBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ?',
        [companyId]
      );
      
      const [monthlyBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ? AND createdAt >= ?',
        [companyId, startOfMonth]
      );
      
      const [lastMonthBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ? AND createdAt >= ? AND createdAt <= ?',
        [companyId, startOfLastMonth, endOfLastMonth]
      );
      
      // Get rating stats
      const [ratingResult] = await connection.execute(
        'SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews FROM reviews WHERE companyId = ?',
        [companyId]
      );
      
      // Get customer stats
      const [newCustomersResult] = await connection.execute(
        `SELECT COUNT(DISTINCT petOwnerId) as total FROM bookings 
         WHERE companyId = ? AND createdAt >= ? 
         AND petOwnerId NOT IN (
           SELECT DISTINCT petOwnerId FROM bookings 
           WHERE companyId = ? AND createdAt < ?
         )`,
        [companyId, startOfMonth, companyId, startOfMonth]
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
      
      // Get popular services
      const [popularServicesResult] = await connection.execute(
        `SELECT s.name, s.price, COUNT(b.id) as bookingCount 
         FROM services s 
         LEFT JOIN bookings b ON s.id = b.serviceId 
         WHERE s.companyId = ? 
         GROUP BY s.id, s.name, s.price 
         ORDER BY bookingCount DESC 
         LIMIT 5`,
        [companyId]
      );
      
      // Get monthly trends (last 6 months)
      const [monthlyTrendsResult] = await connection.execute(
        `SELECT 
           DATE_FORMAT(createdAt, '%Y-%m') as month,
           COUNT(*) as bookings,
           SUM(CASE WHEN status = 'completed' THEN totalAmount ELSE 0 END) as revenue
         FROM bookings 
         WHERE companyId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
         ORDER BY month`,
        [companyId]
      );
      
      // Calculate growth rates
      const currentMonthRevenue = parseFloat(monthlyRevenueResult[0].total) || 0;
      const lastMonthRevenue = parseFloat(lastMonthRevenueResult[0].total) || 0;
      const revenueGrowth = lastMonthRevenue > 0 ? 
        ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
      
      const currentMonthBookings = monthlyBookingsResult[0].total || 0;
      const lastMonthBookings = lastMonthBookingsResult[0].total || 0;
      const bookingGrowth = lastMonthBookings > 0 ? 
        ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;
      
      const totalCustomers = newCustomersResult[0].total + returningCustomersResult[0].total;
      const customerRetentionRate = totalCustomers > 0 ? 
        (returningCustomersResult[0].total / totalCustomers) * 100 : 0;
      
      const overview = {
        totalRevenue: parseFloat(totalRevenueResult[0].total) || 0.00,
        monthlyRevenue: currentMonthRevenue,
        yearlyRevenue: parseFloat(yearlyRevenueResult[0].total) || 0.00,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalBookings: totalBookingsResult[0].total || 0,
        monthlyBookings: currentMonthBookings,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        averageRating: parseFloat(ratingResult[0].avgRating) || 0.0,
        totalReviews: ratingResult[0].totalReviews || 0,
        newCustomers: newCustomersResult[0].total || 0,
        returningCustomers: returningCustomersResult[0].total || 0,
        customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
        popularServices: popularServicesResult.map(service => ({
          name: service.name,
          bookings: service.bookingCount,
          revenue: parseFloat(service.price) * service.bookingCount,
          price: parseFloat(service.price)
        })),
        monthlyTrends: monthlyTrendsResult.map(trend => ({
          month: trend.month,
          bookings: trend.bookings,
          revenue: parseFloat(trend.revenue) || 0
        }))
      };

      res.json({
        success: true,
        data: overview
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get analytics overview'
    });
  }
});

// GET /api/analytics/revenue - Get detailed revenue analytics
router.get('/revenue', verifyToken, requireCompany, async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    // TODO: Implement database query to get revenue data
    // For now, return empty revenue data
    const revenueData = [];
    const totalRevenue = 0;
    const totalBookings = 0;
    const averageOrderValue = 0;

    res.json({
      success: true,
      data: {
        revenueData,
        totalRevenue,
        totalBookings,
        averageOrderValue,
        period,
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get revenue analytics'
    });
  }
});

// GET /api/analytics/services - Get service performance analytics
router.get('/services', verifyToken, requireCompany, async (req, res) => {
  try {
    // TODO: Implement database query to get service analytics
    // For now, return empty service analytics
    const serviceAnalytics = [];

    res.json({
      success: true,
      data: serviceAnalytics
    });
  } catch (error) {
    console.error('Error getting service analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get service analytics'
    });
  }
});

// GET /api/analytics/customers - Get customer analytics
router.get('/customers', verifyToken, requireCompany, async (req, res) => {
  try {
    // TODO: Implement database query to get customer analytics
    // For now, return empty customer analytics
    const customerAnalytics = {
      totalCustomers: 0,
      newCustomers: {
        thisMonth: 0,
        lastMonth: 0,
        growth: 0.0
      },
      returningCustomers: {
        thisMonth: 0,
        lastMonth: 0,
        rate: 0.0
      },
      customerLifetimeValue: 0.00,
      averageBookingsPerCustomer: 0.0,
      topCustomers: [],
      customerSegments: [],
      acquisitionChannels: []
    };

    res.json({
      success: true,
      data: customerAnalytics
    });
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get customer analytics'
    });
  }
});

// GET /api/analytics/ratings - Get ratings and reviews analytics
router.get('/ratings', verifyToken, requireCompany, async (req, res) => {
  try {
    // TODO: Implement database query to get ratings analytics
    // For now, return empty ratings analytics
    const ratingAnalytics = {
      overallRating: 0.0,
      totalReviews: 0,
      ratingDistribution: [],
      recentReviews: [],
      ratingTrends: []
    };

    res.json({
      success: true,
      data: ratingAnalytics
    });
  } catch (error) {
    console.error('Error getting rating analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get rating analytics'
    });
  }
});

// GET /api/analytics/performance - Get business performance metrics
router.get('/performance', verifyToken, requireCompany, async (req, res) => {
  try {
    // TODO: Implement database query to get performance metrics
    // For now, return empty performance metrics
    const performanceMetrics = {
      bookingConversionRate: 0.0,
      customerSatisfactionScore: 0.0,
      averageResponseTime: 0.0,
      bookingCancellationRate: 0.0,
      serviceCompletionRate: 0.0,
      revenuePerBooking: 0.00,
      bookingsPerDay: 0.0,
      peakDays: [],
      peakHours: [],
      seasonalTrends: [],
      competitorComparison: {
        yourRating: 0.0,
        averageMarketRating: 0.0,
        yourPricing: 'standard',
        marketPosition: 'new'
      }
    };

    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    console.error('Error getting performance analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get performance analytics'
    });
  }
});

export default router; 