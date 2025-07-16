import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/companies/profile - Get company profile
router.get('/profile', verifyToken, requireCompany, async (req, res) => {
  try {
    // For now, return mock data - in a real app this would query a database
    const companyProfile = {
      id: req.user.uid,
      name: 'Happy Paws Pet Services',
      email: req.user.email,
      phone: '+1 (555) 123-4567',
      address: '123 Pet Street, Pet City, PC 12345',
      description: 'Professional pet care services with over 10 years of experience.',
      services: ['Grooming', 'Pet Sitting', 'Dog Walking', 'Veterinary'],
      rating: 4.8,
      totalBookings: 245,
      businessHours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      images: [
        'https://via.placeholder.com/400x300?text=Pet+Service+1',
        'https://via.placeholder.com/400x300?text=Pet+Service+2'
      ],
      verified: true,
      joinedDate: '2023-01-15'
    };

    res.json({
      success: true,
      data: companyProfile
    });
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
      businessHours,
      images
    } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, phone, and address are required'
      });
    }

    // In a real app, this would update the database
    const updatedProfile = {
      id: req.user.uid,
      name,
      email: req.user.email,
      phone,
      address,
      description: description || '',
      businessHours: businessHours || {},
      images: images || [],
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update company profile'
    });
  }
});

// GET /api/companies/stats - Get company statistics
router.get('/stats', verifyToken, requireCompany, async (req, res) => {
  try {
    // Mock statistics data
    const stats = {
      totalBookings: 245,
      pendingBookings: 12,
      completedBookings: 220,
      cancelledBookings: 13,
      totalRevenue: 15420.50,
      monthlyRevenue: 2840.75,
      averageRating: 4.8,
      totalReviews: 156,
      newCustomers: 24,
      returningCustomers: 89
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting company stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get company statistics'
    });
  }
});

// GET /api/companies/dashboard-data - Get all dashboard data at once
router.get('/dashboard-data', verifyToken, requireCompany, async (req, res) => {
  try {
    // Mock dashboard data
    const dashboardData = {
      recentBookings: [
        {
          id: 'booking_1',
          petOwnerName: 'John Smith',
          serviceName: 'Dog Grooming',
          petName: 'Buddy',
          petType: 'Dog',
          date: '2024-01-15',
          time: '10:00 AM',
          status: 'confirmed',
          amount: 85.00
        },
        {
          id: 'booking_2',
          petOwnerName: 'Sarah Johnson',
          serviceName: 'Pet Sitting',
          petName: 'Whiskers',
          petType: 'Cat',
          date: '2024-01-16',
          time: '2:00 PM',
          status: 'pending',
          amount: 120.00
        },
        {
          id: 'booking_3',
          petOwnerName: 'Mike Wilson',
          serviceName: 'Dog Walking',
          petName: 'Rex',
          petType: 'Dog',
          date: '2024-01-17',
          time: '8:00 AM',
          status: 'completed',
          amount: 45.00
        }
      ],
      recentReviews: [
        {
          id: 'review_1',
          petOwnerName: 'Emily Davis',
          rating: 5,
          comment: 'Excellent service! My dog loved the grooming session.',
          serviceName: 'Dog Grooming',
          date: '2024-01-14'
        },
        {
          id: 'review_2',
          petOwnerName: 'Robert Brown',
          rating: 4,
          comment: 'Great job with pet sitting. Very professional.',
          serviceName: 'Pet Sitting',
          date: '2024-01-13'
        }
      ],
      monthlyEarnings: [
        { month: 'Jan', earnings: 2840.75 },
        { month: 'Dec', earnings: 3120.50 },
        { month: 'Nov', earnings: 2695.25 },
        { month: 'Oct', earnings: 3045.00 },
        { month: 'Sep', earnings: 2780.25 },
        { month: 'Aug', earnings: 3200.75 }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get dashboard data'
    });
  }
});

export default router; 