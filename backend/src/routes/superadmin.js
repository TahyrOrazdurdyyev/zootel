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

    // TODO: Implement Firebase Admin SDK user listing
    // For now, return empty users array
    const mockUsers = [];

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

// PUT /api/superadmin/users/:uid/role - Update user role
router.put('/users/:uid/role', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    const validRoles = ['pet_owner', 'pet_company', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // TODO: Implement Firebase Admin SDK custom claims update
    // await admin.auth().setCustomUserClaims(uid, { role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { uid, role }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role'
    });
  }
});

// PUT /api/superadmin/users/:uid/status - Enable/disable user
router.put('/users/:uid/status', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { disabled } = req.body;

    // TODO: Implement Firebase Admin SDK user update
    // await admin.auth().updateUser(uid, { disabled });

    res.json({
      success: true,
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
      data: { uid, disabled }
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

    // TODO: Implement database query to get all companies
    // For now, return empty companies array
    const mockCompanies = [];

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

// PUT /api/superadmin/companies/:id/verify - Verify/unverify company
router.put('/companies/:id/verify', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    // TODO: Implement database update for company verification
    res.json({
      success: true,
      message: `Company ${verified ? 'verified' : 'unverified'} successfully`,
      data: { id, verified }
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

    // TODO: Implement database update for company status
    res.json({
      success: true,
      message: 'Company status updated successfully',
      data: { id, status }
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
    // TODO: Implement database queries for platform analytics
    // For now, return empty analytics
    const analytics = {
      platformStats: {
        totalUsers: 0,
        totalCompanies: 0,
        totalPetOwners: 0,
        totalBookings: 0,
        totalRevenue: 0.00,
        averageRating: 0.0
      },
      userGrowth: [],
      revenueData: [],
      topCompanies: [],
      recentActivity: []
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

    // TODO: Implement database queries for different report types
    switch (type) {
      case 'users':
        reportData = {
          totalUsers: 0,
          newUsersThisMonth: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          usersByRole: {
            pet_owners: 0,
            pet_companies: 0,
            superadmins: 0
          }
        };
        break;
      
      case 'revenue':
        reportData = {
          totalRevenue: 0.00,
          monthlyRevenue: 0.00,
          averageBookingValue: 0.00,
          topEarningCompanies: []
        };
        break;
      
      default:
        reportData = {
          summary: 'Platform is ready for data',
          totalUsers: 0,
          totalRevenue: 0.00,
          totalBookings: 0,
          averageRating: 0.0
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