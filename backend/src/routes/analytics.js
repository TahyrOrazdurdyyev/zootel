import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/analytics/overview - Get comprehensive business overview
router.get('/overview', verifyToken, requireCompany, async (req, res) => {
  try {
    // Mock analytics data - in a real app, this would query a database
    const overview = {
      totalRevenue: 15420.50,
      monthlyRevenue: 2840.75,
      yearlyRevenue: 18260.25,
      revenueGrowth: 12.5, // percentage
      totalBookings: 245,
      monthlyBookings: 28,
      bookingGrowth: 8.3, // percentage
      averageRating: 4.8,
      totalReviews: 156,
      newCustomers: 24,
      returningCustomers: 89,
      customerRetentionRate: 78.5, // percentage
      popularServices: [
        { name: 'Dog Grooming', bookings: 95, revenue: 8075.00 },
        { name: 'Pet Sitting', bookings: 72, revenue: 8640.00 },
        { name: 'Dog Walking', bookings: 78, revenue: 3510.00 }
      ],
      monthlyTrends: [
        { month: 'Jan', revenue: 2840.75, bookings: 28 },
        { month: 'Dec', revenue: 3120.50, bookings: 31 },
        { month: 'Nov', revenue: 2695.25, bookings: 26 },
        { month: 'Oct', revenue: 3045.00, bookings: 29 },
        { month: 'Sep', revenue: 2780.25, bookings: 27 },
        { month: 'Aug', revenue: 3200.75, bookings: 33 }
      ]
    };

    res.json({
      success: true,
      data: overview
    });
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

    let revenueData;

    if (period === 'daily') {
      // Last 30 days
      revenueData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          revenue: Math.random() * 300 + 50,
          bookings: Math.floor(Math.random() * 5) + 1
        };
      }).reverse();
    } else if (period === 'weekly') {
      // Last 12 weeks
      revenueData = Array.from({ length: 12 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        return {
          week: `Week ${52 - i}`,
          revenue: Math.random() * 1500 + 800,
          bookings: Math.floor(Math.random() * 15) + 5
        };
      }).reverse();
    } else {
      // Monthly (default)
      revenueData = [
        { month: 'Jan', revenue: 2840.75, bookings: 28 },
        { month: 'Feb', revenue: 3120.50, bookings: 31 },
        { month: 'Mar', revenue: 2695.25, bookings: 26 },
        { month: 'Apr', revenue: 3045.00, bookings: 29 },
        { month: 'May', revenue: 2780.25, bookings: 27 },
        { month: 'Jun', revenue: 3200.75, bookings: 33 },
        { month: 'Jul', revenue: 2950.50, bookings: 30 },
        { month: 'Aug', revenue: 3180.25, bookings: 32 },
        { month: 'Sep', revenue: 2875.75, bookings: 28 },
        { month: 'Oct', revenue: 3250.00, bookings: 34 },
        { month: 'Nov', revenue: 2920.25, bookings: 29 },
        { month: 'Dec', revenue: 3350.75, bookings: 35 }
      ];
    }

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalBookings = revenueData.reduce((sum, item) => sum + item.bookings, 0);
    const averageRevenue = totalRevenue / revenueData.length;

    res.json({
      success: true,
      data: {
        period,
        year,
        revenueData,
        summary: {
          totalRevenue,
          totalBookings,
          averageRevenue,
          averageBookings: totalBookings / revenueData.length
        }
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
    const serviceAnalytics = [
      {
        id: 'service_1',
        name: 'Premium Dog Grooming',
        category: 'Grooming',
        totalBookings: 95,
        completedBookings: 88,
        cancelledBookings: 7,
        totalRevenue: 8075.00,
        averageRating: 4.9,
        reviewCount: 65,
        averagePrice: 85.00,
        popularityRank: 1,
        bookingTrend: 'up', // up, down, stable
        bookingTrendPercentage: 15.2
      },
      {
        id: 'service_2',
        name: 'Pet Sitting - Full Day',
        category: 'Pet Sitting',
        totalBookings: 72,
        completedBookings: 68,
        cancelledBookings: 4,
        totalRevenue: 8640.00,
        averageRating: 4.7,
        reviewCount: 48,
        averagePrice: 120.00,
        popularityRank: 2,
        bookingTrend: 'up',
        bookingTrendPercentage: 8.7
      },
      {
        id: 'service_3',
        name: 'Dog Walking',
        category: 'Exercise',
        totalBookings: 78,
        completedBookings: 75,
        cancelledBookings: 3,
        totalRevenue: 3510.00,
        averageRating: 4.6,
        reviewCount: 43,
        averagePrice: 45.00,
        popularityRank: 3,
        bookingTrend: 'stable',
        bookingTrendPercentage: 2.1
      }
    ];

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
    const customerAnalytics = {
      totalCustomers: 156,
      newCustomers: {
        thisMonth: 24,
        lastMonth: 18,
        growth: 33.3
      },
      returningCustomers: {
        thisMonth: 89,
        lastMonth: 78,
        rate: 78.5
      },
      customerLifetimeValue: 485.50,
      averageBookingsPerCustomer: 3.2,
      topCustomers: [
        {
          id: 'customer_1',
          name: 'John Smith',
          totalBookings: 12,
          totalSpent: 1250.00,
          averageRating: 5.0,
          joinDate: '2023-01-15'
        },
        {
          id: 'customer_2',
          name: 'Sarah Johnson',
          totalBookings: 9,
          totalSpent: 1080.00,
          averageRating: 4.8,
          joinDate: '2023-02-20'
        },
        {
          id: 'customer_3',
          name: 'Mike Wilson',
          totalBookings: 8,
          totalSpent: 920.00,
          averageRating: 4.9,
          joinDate: '2023-03-10'
        }
      ],
      customerSegments: [
        { segment: 'High Value', count: 23, percentage: 14.7 },
        { segment: 'Regular', count: 89, percentage: 57.1 },
        { segment: 'Occasional', count: 31, percentage: 19.9 },
        { segment: 'New', count: 13, percentage: 8.3 }
      ],
      acquisitionChannels: [
        { channel: 'Website', customers: 67, percentage: 42.9 },
        { channel: 'Referral', customers: 45, percentage: 28.8 },
        { channel: 'Social Media', customers: 28, percentage: 17.9 },
        { channel: 'Direct', customers: 16, percentage: 10.3 }
      ]
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
    const ratingAnalytics = {
      overallRating: 4.8,
      totalReviews: 156,
      ratingDistribution: [
        { stars: 5, count: 98, percentage: 62.8 },
        { stars: 4, count: 35, percentage: 22.4 },
        { stars: 3, count: 18, percentage: 11.5 },
        { stars: 2, count: 3, percentage: 1.9 },
        { stars: 1, count: 2, percentage: 1.3 }
      ],
      recentReviews: [
        {
          id: 'review_1',
          customerName: 'Emily Davis',
          rating: 5,
          comment: 'Excellent service! My dog loved the grooming session.',
          serviceName: 'Dog Grooming',
          date: '2024-01-14',
          verified: true
        },
        {
          id: 'review_2',
          customerName: 'Robert Brown',
          rating: 4,
          comment: 'Great job with pet sitting. Very professional.',
          serviceName: 'Pet Sitting',
          date: '2024-01-13',
          verified: true
        },
        {
          id: 'review_3',
          customerName: 'Lisa Wilson',
          rating: 5,
          comment: 'Amazing dog walking service. My dog is always excited!',
          serviceName: 'Dog Walking',
          date: '2024-01-12',
          verified: true
        }
      ],
      ratingTrends: [
        { month: 'Jan', averageRating: 4.8, reviewCount: 15 },
        { month: 'Dec', averageRating: 4.7, reviewCount: 18 },
        { month: 'Nov', averageRating: 4.9, reviewCount: 12 },
        { month: 'Oct', averageRating: 4.6, reviewCount: 20 },
        { month: 'Sep', averageRating: 4.8, reviewCount: 14 },
        { month: 'Aug', averageRating: 4.9, reviewCount: 16 }
      ]
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
    const performanceMetrics = {
      bookingConversionRate: 85.2, // percentage of inquiries that become bookings
      customerSatisfactionScore: 4.8,
      averageResponseTime: 2.5, // hours
      bookingCancellationRate: 5.8, // percentage
      serviceCompletionRate: 94.2, // percentage
      revenuePerBooking: 78.50,
      bookingsPerDay: 3.2,
      peakDays: ['Saturday', 'Sunday', 'Friday'],
      peakHours: ['10:00-12:00', '14:00-16:00'],
      seasonalTrends: [
        { season: 'Spring', bookingIncrease: 15.3 },
        { season: 'Summer', bookingIncrease: 22.7 },
        { season: 'Fall', bookingIncrease: 8.9 },
        { season: 'Winter', bookingIncrease: -5.2 }
      ],
      competitorComparison: {
        yourRating: 4.8,
        averageMarketRating: 4.3,
        yourPricing: 'premium',
        marketPosition: 'above average'
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