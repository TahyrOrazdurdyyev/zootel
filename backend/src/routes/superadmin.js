import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';
import admin from '../config/firebase.js';

const router = express.Router();

// Middleware to require superadmin role
const requireSuperadmin = requireRole(['superadmin']);

// GET /api/superadmin/users - Get all users with pagination and filtering
router.get('/users', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    // Get users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers(1000); // Firebase limit per request
    const allUsers = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || '',
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      role: userRecord.customClaims?.role || 'pet_owner',
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    }));

    let filteredUsers = allUsers;

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

    // Update user role using Firebase Admin SDK
    await admin.auth().setCustomUserClaims(uid, { role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { uid, role }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User does not exist'
      });
    }
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

    // Update user status using Firebase Admin SDK
    await admin.auth().updateUser(uid, { disabled });

    res.json({
      success: true,
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
      data: { uid, disabled }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User does not exist'
      });
    }
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
    const connection = await pool.getConnection();

    try {
      // Build query with filters
      let query = `
        SELECT c.*, 
               COUNT(DISTINCT b.id) as totalBookings,
               COUNT(DISTINCT s.id) as totalServices,
               AVG(r.rating) as averageRating,
               SUM(CASE WHEN b.status = 'completed' THEN b.totalAmount ELSE 0 END) as totalRevenue
        FROM companies c
        LEFT JOIN bookings b ON c.id = b.companyId
        LEFT JOIN services s ON c.id = s.companyId
        LEFT JOIN reviews r ON c.id = r.companyId
      `;
      
      const queryParams = [];
      const whereConditions = [];
      
      // Apply status filter
      if (status) {
        whereConditions.push('c.status = ?');
        queryParams.push(status);
      }
      
      // Apply search filter
      if (search) {
        whereConditions.push('(c.name LIKE ? OR c.email LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      query += ' GROUP BY c.id ORDER BY c.createdAt DESC';
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM companies c';
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      const [countResult] = await connection.execute(countQuery, queryParams);
      const totalCompanies = countResult[0].total;
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const [companiesResult] = await connection.execute(query, queryParams);
      
      const companies = companiesResult.map(company => ({
        id: company.id,
        name: company.name || '',
        email: company.email,
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zipCode: company.zipCode || '',
        description: company.description || '',
        businessHours: company.businessHours ? JSON.parse(company.businessHours) : {},
        logoUrl: company.logoUrl || '',
        verified: Boolean(company.verified),
        subscriptionPlan: company.subscriptionPlan || 'basic',
        subscriptionStatus: company.subscriptionStatus || 'active',
        status: company.status || 'active',
        totalBookings: company.totalBookings || 0,
        totalServices: company.totalServices || 0,
        averageRating: parseFloat(company.averageRating) || 0.0,
        totalRevenue: parseFloat(company.totalRevenue) || 0.00,
        joinedDate: company.createdAt ? company.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastActive: company.updatedAt || company.createdAt
      }));

      res.json({
        success: true,
        data: companies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCompanies / limit),
          totalCompanies: totalCompanies,
          limit: parseInt(limit)
        }
      });

    } finally {
      connection.release();
    }
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
    const connection = await pool.getConnection();

    try {
      // Update company verification status
      await connection.execute(
        'UPDATE companies SET verified = ?, updatedAt = ? WHERE id = ?',
        [verified, new Date(), id]
      );

      res.json({
        success: true,
        message: `Company ${verified ? 'verified' : 'unverified'} successfully`,
        data: { id, verified }
      });

    } finally {
      connection.release();
    }
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

    const connection = await pool.getConnection();

    try {
      // Update company status
      await connection.execute(
        'UPDATE companies SET status = ?, updatedAt = ? WHERE id = ?',
        [status, new Date(), id]
      );

      res.json({
        success: true,
        message: 'Company status updated successfully',
        data: { id, status }
      });

    } finally {
      connection.release();
    }
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
    const connection = await pool.getConnection();

    try {
      // Get platform-wide statistics
      const [usersCountResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM (SELECT id FROM companies UNION SELECT id FROM pet_owners) as all_users'
      );
      
      const [companiesCountResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM companies'
      );
      
      const [petOwnersCountResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM pet_owners'
      );
      
      const [bookingsCountResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings'
      );
      
      const [totalRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE status = "completed"'
      );
      
      const [averageRatingResult] = await connection.execute(
        'SELECT AVG(rating) as average FROM reviews'
      );

      // Get user growth data (last 12 months)
      const [userGrowthResult] = await connection.execute(`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as new_companies
        FROM companies 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
        ORDER BY month ASC
      `);

      const [petOwnerGrowthResult] = await connection.execute(`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as new_pet_owners
        FROM pet_owners 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
        ORDER BY month ASC
      `);

      // Get revenue data (last 12 months)
      const [revenueDataResult] = await connection.execute(`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          SUM(totalAmount) as revenue,
          COUNT(*) as bookings
        FROM bookings 
        WHERE status = 'completed' AND createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
        ORDER BY month ASC
      `);

      // Get top companies by revenue
      const [topCompaniesResult] = await connection.execute(`
        SELECT 
          c.id,
          c.name,
          c.city,
          c.state,
          COUNT(b.id) as totalBookings,
          SUM(b.totalAmount) as totalRevenue,
          AVG(r.rating) as averageRating
        FROM companies c
        LEFT JOIN bookings b ON c.id = b.companyId AND b.status = 'completed'
        LEFT JOIN reviews r ON c.id = r.companyId
        GROUP BY c.id
        ORDER BY totalRevenue DESC
        LIMIT 10
      `);

      // Get recent activity
      const [recentActivityResult] = await connection.execute(`
        SELECT 
          'booking' as type,
          b.id,
          b.createdAt as date,
          c.name as companyName,
          po.name as customerName,
          s.name as serviceName
        FROM bookings b
        LEFT JOIN companies c ON b.companyId = c.id
        LEFT JOIN pet_owners po ON b.petOwnerId = po.id
        LEFT JOIN services s ON b.serviceId = s.id
        ORDER BY b.createdAt DESC
        LIMIT 20
      `);

      const analytics = {
        platformStats: {
          totalUsers: usersCountResult[0].total || 0,
          totalCompanies: companiesCountResult[0].total || 0,
          totalPetOwners: petOwnersCountResult[0].total || 0,
          totalBookings: bookingsCountResult[0].total || 0,
          totalRevenue: parseFloat(totalRevenueResult[0].total) || 0.00,
          averageRating: parseFloat(averageRatingResult[0].average) || 0.0
        },
        userGrowth: userGrowthResult.map(item => ({
          month: item.month,
          companies: item.new_companies || 0,
          petOwners: petOwnerGrowthResult.find(po => po.month === item.month)?.new_pet_owners || 0
        })),
        revenueData: revenueDataResult.map(item => ({
          month: item.month,
          revenue: parseFloat(item.revenue) || 0,
          bookings: item.bookings || 0
        })),
        topCompanies: topCompaniesResult.map(company => ({
          id: company.id,
          name: company.name || 'Unnamed Company',
          location: `${company.city || ''}, ${company.state || ''}`.trim(),
          totalBookings: company.totalBookings || 0,
          totalRevenue: parseFloat(company.totalRevenue) || 0.00,
          averageRating: parseFloat(company.averageRating) || 0.0
        })),
        recentActivity: recentActivityResult.map(activity => ({
          type: activity.type,
          id: activity.id,
          date: activity.date,
          description: `${activity.customerName || 'Customer'} booked ${activity.serviceName || 'service'} at ${activity.companyName || 'company'}`
        }))
      };

      res.json({
        success: true,
        data: analytics
      });

    } finally {
      connection.release();
    }
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
    const connection = await pool.getConnection();

    try {
      let reportData;

      switch (type) {
        case 'users': {
          // Get Firebase users count by role
          const listUsersResult = await admin.auth().listUsers(1000);
          const usersByRole = {
            pet_owners: 0,
            pet_companies: 0,
            superadmins: 0
          };

          listUsersResult.users.forEach(user => {
            const role = user.customClaims?.role || 'pet_owner';
            if (usersByRole[role] !== undefined) {
              usersByRole[role]++;
            }
          });

          const [activeUsersResult] = await connection.execute(`
            SELECT COUNT(DISTINCT po.id) + COUNT(DISTINCT c.id) as total
            FROM pet_owners po, companies c
            WHERE po.lastActiveDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
               OR c.updatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          `);

          const [newUsersThisMonthResult] = await connection.execute(`
            SELECT COUNT(*) as total FROM (
              SELECT createdAt FROM companies WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
              UNION
              SELECT createdAt FROM pet_owners WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            ) as new_users
          `);

          reportData = {
            totalUsers: listUsersResult.users.length,
            newUsersThisMonth: newUsersThisMonthResult[0].total || 0,
            activeUsers: activeUsersResult[0].total || 0,
            usersByRole
          };
          break;
        }
        
        case 'revenue': {
          let dateFilter = '';
          const queryParams = [];

          if (startDate && endDate) {
            dateFilter = ' AND createdAt BETWEEN ? AND ?';
            queryParams.push(startDate, endDate);
          }

          const [totalRevenueResult] = await connection.execute(
            `SELECT SUM(totalAmount) as total FROM bookings WHERE status = 'completed'${dateFilter}`,
            queryParams
          );

          const [monthlyRevenueResult] = await connection.execute(
            `SELECT SUM(totalAmount) as total FROM bookings 
             WHERE status = 'completed' AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)${dateFilter}`,
            queryParams
          );

          const [avgBookingValueResult] = await connection.execute(
            `SELECT AVG(totalAmount) as average FROM bookings WHERE status = 'completed'${dateFilter}`,
            queryParams
          );

          const [topEarningResult] = await connection.execute(`
            SELECT c.name, SUM(b.totalAmount) as revenue
            FROM companies c
            JOIN bookings b ON c.id = b.companyId
            WHERE b.status = 'completed'${dateFilter}
            GROUP BY c.id
            ORDER BY revenue DESC
            LIMIT 10
          `, queryParams);

          reportData = {
            totalRevenue: parseFloat(totalRevenueResult[0].total) || 0.00,
            monthlyRevenue: parseFloat(monthlyRevenueResult[0].total) || 0.00,
            averageBookingValue: parseFloat(avgBookingValueResult[0].average) || 0.00,
            topEarningCompanies: topEarningResult.map(company => ({
              name: company.name,
              revenue: parseFloat(company.revenue)
            }))
          };
          break;
        }
        
        default: {
          const [summaryStats] = await connection.execute(`
            SELECT 
              (SELECT COUNT(*) FROM companies) as totalCompanies,
              (SELECT COUNT(*) FROM pet_owners) as totalPetOwners,
              (SELECT COUNT(*) FROM bookings) as totalBookings,
              (SELECT SUM(totalAmount) FROM bookings WHERE status = 'completed') as totalRevenue,
              (SELECT AVG(rating) FROM reviews) as averageRating
          `);

          reportData = {
            summary: 'Platform Performance Report',
            totalCompanies: summaryStats[0].totalCompanies || 0,
            totalPetOwners: summaryStats[0].totalPetOwners || 0,
            totalRevenue: parseFloat(summaryStats[0].totalRevenue) || 0.00,
            totalBookings: summaryStats[0].totalBookings || 0,
            averageRating: parseFloat(summaryStats[0].averageRating) || 0.0
          };
        }
      }

      res.json({
        success: true,
        reportType: type,
        dateRange: { startDate, endDate },
        data: reportData,
        generatedAt: new Date().toISOString()
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate report'
    });
  }
});

export default router; 