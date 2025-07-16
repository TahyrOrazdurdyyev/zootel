import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Import bookings data to check for real company activity
const mockBookingsData = [
  {
    id: 'booking_1',
    companyId: 'company_1',
    petOwnerId: 'owner_1',
    petOwnerName: 'John Smith',
    petOwnerEmail: 'john.smith@email.com',
    petOwnerPhone: '+1 (555) 123-4567',
    serviceId: 'service_1',
    serviceName: 'Premium Dog Grooming',
    petName: 'Buddy',
    petType: 'Dog',
    petBreed: 'Golden Retriever',
    petAge: '3 years',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: 120,
    price: 85.00,
    status: 'confirmed',
    notes: 'First time customer. Dog is very friendly.',
    specialRequirements: 'Use hypoallergenic shampoo',
    createdAt: '2024-01-10T14:30:00.000Z',
    updatedAt: '2024-01-11T09:15:00.000Z'
  },
  {
    id: 'booking_2',
    companyId: 'company_1',
    petOwnerId: 'owner_2',
    petOwnerName: 'Sarah Johnson',
    petOwnerEmail: 'sarah.johnson@email.com',
    petOwnerPhone: '+1 (555) 234-5678',
    serviceId: 'service_2',
    serviceName: 'Pet Sitting - Full Day',
    petName: 'Whiskers',
    petType: 'Cat',
    petBreed: 'Persian',
    petAge: '5 years',
    date: '2024-01-16',
    time: '2:00 PM',
    duration: 480,
    price: 120.00,
    status: 'pending',
    notes: 'Cat needs medication twice daily.',
    specialRequirements: 'Indoor only, no other pets',
    createdAt: '2024-01-12T10:45:00.000Z',
    updatedAt: '2024-01-12T10:45:00.000Z'
  },
  {
    id: 'booking_3',
    companyId: 'company_1',
    petOwnerId: 'owner_3',
    petOwnerName: 'Mike Wilson',
    petOwnerEmail: 'mike.wilson@email.com',
    petOwnerPhone: '+1 (555) 345-6789',
    serviceId: 'service_3',
    serviceName: 'Dog Walking',
    petName: 'Rex',
    petType: 'Dog',
    petBreed: 'German Shepherd',
    petAge: '2 years',
    date: '2024-01-17',
    time: '8:00 AM',
    duration: 30,
    price: 45.00,
    status: 'completed',
    notes: 'Very energetic dog, loves to run',
    specialRequirements: 'Avoid other large dogs',
    createdAt: '2024-01-14T11:20:00.000Z',
    updatedAt: '2024-01-17T08:30:00.000Z'
  }
];

// Mock reviews data
const mockReviewsData = [
  {
    id: 'review_1',
    companyId: 'company_1',
    petOwnerName: 'Emily Davis',
    rating: 5,
    comment: 'Excellent service! My dog loved the grooming session.',
    serviceName: 'Dog Grooming',
    date: '2024-01-14'
  },
  {
    id: 'review_2',
    companyId: 'company_1',
    petOwnerName: 'Robert Brown',
    rating: 4,
    comment: 'Great job with pet sitting. Very professional.',
    serviceName: 'Pet Sitting',
    date: '2024-01-13'
  }
];

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/companies/profile - Get company profile
router.get('/profile', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    
    // Get bookings and reviews for this specific company to determine if it's new
    const companyBookings = mockBookingsData.filter(booking => booking.companyId === companyId);
    const companyReviews = mockReviewsData.filter(review => review.companyId === companyId);
    
    // Check if this is the demo company or a new company
    if (companyId === 'company_1' || companyBookings.length > 0) {
      // Return demo data for the existing demo company
      const companyProfile = {
        id: req.user.uid,
        name: 'Happy Paws Pet Services',
        email: req.user.email,
        phone: '+1 (555) 123-4567',
        address: '123 Pet Street, Pet City, PC 12345',
        description: 'Professional pet care services with over 10 years of experience.',
        services: ['Grooming', 'Pet Sitting', 'Dog Walking', 'Veterinary'],
        rating: 4.8,
        totalBookings: companyBookings.length,
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
      return;
    }

    // Return empty profile for new companies
    const companyProfile = {
      id: req.user.uid,
      name: '', // Empty - they need to set their company name
      email: req.user.email,
      phone: '', // Empty - they need to add their phone
      address: '', // Empty - they need to add their address
      description: '', // Empty - they need to add description
      services: [], // Empty - no services added yet
      rating: 0.0, // No rating yet
      totalBookings: 0, // No bookings yet
      businessHours: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      images: [], // No images uploaded yet
      verified: false, // Not verified yet
      joinedDate: new Date().toISOString().split('T')[0] // Today's date
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
    const companyId = req.user.uid;
    
    // Get bookings for this specific company
    const companyBookings = mockBookingsData.filter(booking => booking.companyId === companyId);
    const companyReviews = mockReviewsData.filter(review => review.companyId === companyId);
    
    // Check if this is a new company with no activity
    if (companyBookings.length === 0) {
      // Return empty stats for new companies
      const stats = {
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0.00,
        monthlyRevenue: 0.00,
        averageRating: 0.0,
        totalReviews: 0,
        newCustomers: 0,
        returningCustomers: 0
      };

      res.json({
        success: true,
        data: stats
      });
      return;
    }

    // Calculate real statistics from actual bookings
    const completedBookings = companyBookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
    
    // Calculate average rating from reviews
    const averageRating = companyReviews.length > 0 
      ? companyReviews.reduce((sum, r) => sum + r.rating, 0) / companyReviews.length 
      : 0.0;

    // For the demo company 'company_1', show the original mock data
    const stats = {
      totalBookings: companyBookings.length,
      pendingBookings: companyBookings.filter(b => b.status === 'pending').length,
      completedBookings: completedBookings.length,
      cancelledBookings: companyBookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: 15420.50, // Legacy total for demo company
      monthlyRevenue: 2840.75, // This month's revenue
      averageRating: averageRating,
      totalReviews: companyReviews.length,
      newCustomers: 24, // Mock data for demo company
      returningCustomers: 89 // Mock data for demo company
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
    const companyId = req.user.uid;
    
    // Get bookings and reviews for this specific company
    const companyBookings = mockBookingsData.filter(booking => booking.companyId === companyId);
    const companyReviews = mockReviewsData.filter(review => review.companyId === companyId);
    
    // Check if this is a new company with no activity
    if (companyBookings.length === 0) {
      // Return empty dashboard data for new companies
      const dashboardData = {
        recentBookings: [],
        recentReviews: [],
        monthlyEarnings: [
          { month: 'Jan', earnings: 0 },
          { month: 'Dec', earnings: 0 },
          { month: 'Nov', earnings: 0 },
          { month: 'Oct', earnings: 0 },
          { month: 'Sep', earnings: 0 },
          { month: 'Aug', earnings: 0 }
        ]
      };

      res.json({
        success: true,
        data: dashboardData
      });
      return;
    }

    // Return real data for companies with activity (like the demo company)
    const dashboardData = {
      recentBookings: companyBookings.slice(0, 5).map(booking => ({
        id: booking.id,
        petOwnerName: booking.petOwnerName,
        serviceName: booking.serviceName,
        petName: booking.petName,
        petType: booking.petType,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        amount: booking.price
      })),
      recentReviews: companyReviews.slice(0, 5),
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