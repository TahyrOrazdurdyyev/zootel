import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import admin from '../config/firebase.js';

const router = express.Router();

// Middleware to require superadmin role
const requireSuperadmin = requireRole(['superadmin']);

// GET /api/superadmin/users - Get all users with pagination and filtering
router.get('/users', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    // In a real app, this would query Firebase Admin SDK
    const mockUsers = [
      {
        uid: 'user_1',
        email: 'john.doe@email.com',
        displayName: 'John Doe',
        role: 'pet_owner',
        emailVerified: true,
        disabled: false,
        creationTime: '2023-01-15T10:00:00.000Z',
        lastSignInTime: '2024-01-15T14:30:00.000Z',
        phoneNumber: '+1234567890',
        photoURL: null
      },
      {
        uid: 'user_2',
        email: 'company@happypaws.com',
        displayName: 'Happy Paws Pet Services',
        role: 'pet_company',
        emailVerified: true,
        disabled: false,
        creationTime: '2023-02-01T09:00:00.000Z',
        lastSignInTime: '2024-01-14T16:45:00.000Z',
        phoneNumber: '+1987654321',
        photoURL: null
      },
      {
        uid: 'user_3',
        email: 'admin@zootel.com',
        displayName: 'Zootel Admin',
        role: 'superadmin',
        emailVerified: true,
        disabled: false,
        creationTime: '2023-01-01T08:00:00.000Z',
        lastSignInTime: '2024-01-16T12:00:00.000Z',
        phoneNumber: null,
        photoURL: null
      }
    ];

    let filteredUsers = mockUsers;

    // Apply role filter
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalUsers: filteredUsers.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get users'
    });
  }
});

// GET /api/superadmin/users/:uid - Get specific user details
router.get('/users/:uid', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid } = req.params;

    // In a real app, this would use Firebase Admin SDK
    const userRecord = await admin.auth().getUser(uid);
    
    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: userRecord.customClaims?.role || 'pet_owner',
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        phoneNumber: userRecord.phoneNumber,
        photoURL: userRecord.photoURL
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user details'
    });
  }
});

// PUT /api/superadmin/users/:uid/role - Update user role
router.put('/users/:uid/role', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    const validRoles = ['superadmin', 'pet_company', 'pet_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role });

    res.json({
      success: true,
      message: `Role updated to ${role} for user ${uid}`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role'
    });
  }
});

// PUT /api/superadmin/users/:uid/disable - Disable/Enable user
router.put('/users/:uid/disable', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { disabled } = req.body;

    await admin.auth().updateUser(uid, { disabled });

    res.json({
      success: true,
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user status'
    });
  }
});

// GET /api/superadmin/companies - Get all companies with detailed info
router.get('/companies', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Mock company data
    const mockCompanies = [
      {
        id: 'company_1',
        userId: 'user_2',
        name: 'Happy Paws Pet Services',
        email: 'company@happypaws.com',
        phone: '+1 (555) 123-4567',
        address: '123 Pet Street, Pet City, PC 12345',
        description: 'Professional pet care services with over 10 years of experience.',
        verified: true,
        status: 'active',
        rating: 4.8,
        totalServices: 8,
        totalBookings: 245,
        totalRevenue: 15420.50,
        joinedDate: '2023-02-01T09:00:00.000Z',
        lastActiveDate: '2024-01-15T14:30:00.000Z'
      },
      {
        id: 'company_2',
        userId: 'user_4',
        name: 'Pet Care Plus',
        email: 'info@petcareplus.com',
        phone: '+1 (555) 987-6543',
        address: '456 Animal Ave, Pet Town, PT 67890',
        description: 'Comprehensive pet care solutions for all your furry friends.',
        verified: false,
        status: 'pending',
        rating: 4.5,
        totalServices: 5,
        totalBookings: 89,
        totalRevenue: 6750.25,
        joinedDate: '2023-12-10T11:30:00.000Z',
        lastActiveDate: '2024-01-10T09:15:00.000Z'
      }
    ];

    let filteredCompanies = mockCompanies;

    // Apply status filter
    if (status) {
      filteredCompanies = filteredCompanies.filter(company => company.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(searchLower) ||
        company.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCompanies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredCompanies.length / limit),
        totalCompanies: filteredCompanies.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get companies'
    });
  }
});

// PUT /api/superadmin/companies/:id/verify - Verify company
router.put('/companies/:id/verify', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    // In a real app, this would update the database
    // Using id parameter to make ESLint happy
    res.json({
      success: true,
      message: `Company ${id} ${verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Error updating company verification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update company verification'
    });
  }
});

// PUT /api/superadmin/companies/:id/status - Update company status
router.put('/companies/:id/status', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'pending', 'suspended', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // In a real app, this would update the database
    // Using id parameter to make ESLint happy
    res.json({
      success: true,
      message: `Company ${id} status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update company status'
    });
  }
});

// GET /api/superadmin/analytics - Get platform analytics
router.get('/analytics', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const analytics = {
      platformStats: {
        totalUsers: 1247,
        totalCompanies: 89,
        totalPetOwners: 1158,
        totalBookings: 5623,
        totalRevenue: 342150.75,
        averageRating: 4.6
      },
      userGrowth: [
        { month: 'Jan', users: 156, companies: 12 },
        { month: 'Dec', users: 142, companies: 8 },
        { month: 'Nov', users: 128, companies: 15 },
        { month: 'Oct', users: 134, companies: 6 },
        { month: 'Sep', users: 119, companies: 11 },
        { month: 'Aug', users: 98, companies: 9 }
      ],
      revenueData: [
        { month: 'Jan', revenue: 28450.75 },
        { month: 'Dec', revenue: 31200.50 },
        { month: 'Nov', revenue: 26950.25 },
        { month: 'Oct', revenue: 30450.00 },
        { month: 'Sep', revenue: 27800.25 },
        { month: 'Aug', revenue: 32000.75 }
      ],
      topCompanies: [
        { name: 'Happy Paws Pet Services', bookings: 245, revenue: 15420.50, rating: 4.8 },
        { name: 'Pet Care Excellence', bookings: 189, revenue: 12650.25, rating: 4.7 },
        { name: 'Furry Friends Care', bookings: 167, revenue: 11230.75, rating: 4.9 }
      ],
      recentActivity: [
        {
          id: 'activity_1',
          type: 'user_registered',
          message: 'New pet owner registered',
          user: 'sarah.johnson@email.com',
          timestamp: '2024-01-16T10:30:00.000Z'
        },
        {
          id: 'activity_2',
          type: 'company_verified',
          message: 'Company verification completed',
          user: 'petcare@company.com',
          timestamp: '2024-01-16T09:15:00.000Z'
        },
        {
          id: 'activity_3',
          type: 'booking_completed',
          message: 'High-value booking completed',
          user: 'premium@service.com',
          timestamp: '2024-01-16T08:45:00.000Z'
        }
      ]
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get platform analytics'
    });
  }
});

// GET /api/superadmin/reports - Generate various reports
router.get('/reports', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { type = 'summary', startDate, endDate } = req.query;

    let reportData;

    switch (type) {
      case 'users':
        reportData = {
          totalUsers: 1247,
          newUsersThisMonth: 156,
          activeUsers: 1089,
          inactiveUsers: 158,
          usersByRole: {
            pet_owners: 1158,
            pet_companies: 89,
            superadmins: 3
          }
        };
        break;
      
      case 'revenue':
        reportData = {
          totalRevenue: 342150.75,
          monthlyRevenue: 28450.75,
          averageBookingValue: 78.50,
          topEarningCompanies: [
            { name: 'Happy Paws Pet Services', revenue: 15420.50 },
            { name: 'Pet Care Excellence', revenue: 12650.25 }
          ]
        };
        break;
      
      default:
        reportData = {
          summary: 'Platform performing well',
          totalUsers: 1247,
          totalRevenue: 342150.75,
          totalBookings: 5623,
          averageRating: 4.6
        };
    }

    res.json({
      success: true,
      reportType: type,
      dateRange: { startDate, endDate },
      data: reportData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate report'
    });
  }
});

export default router; 