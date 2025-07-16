import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/companies/profile - Get company profile
router.get('/profile', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    
    // TODO: Implement database query to get company profile and bookings
    // For now, return empty profile for new companies
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
    // TODO: Implement database query to get company analytics
    // For now, return empty analytics
    const analytics = {
      totalBookings: 0,
      monthlyBookings: 0,
      totalRevenue: 0.00,
      monthlyRevenue: 0.00,
      averageRating: 0.0,
      totalReviews: 0,
      newCustomers: 0,
      returningCustomers: 0
    };

    res.json({
      success: true,
      data: analytics
    });
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

export default router; 