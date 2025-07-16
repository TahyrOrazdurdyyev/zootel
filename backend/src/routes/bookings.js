import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/bookings - Get all bookings for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    const companyId = req.user.uid;
    const connection = await pool.getConnection();

    try {
      // Build the query with filters
      let query = `
        SELECT b.*, 
               s.name as serviceName, 
               s.price as servicePrice,
               po.name as customerName,
               po.email as customerEmail,
               po.phone as customerPhone,
               p.name as petName,
               p.type as petType,
               e.name as employeeName
        FROM bookings b
        LEFT JOIN services s ON b.serviceId = s.id
        LEFT JOIN pet_owners po ON b.petOwnerId = po.id
        LEFT JOIN pets p ON b.petId = p.id
        LEFT JOIN employees e ON b.employeeId = e.id
        WHERE b.companyId = ?
      `;
      
      const queryParams = [companyId];
      
      // Apply filters
      if (status) {
        query += ' AND b.status = ?';
        queryParams.push(status);
      }
      
      if (date) {
        query += ' AND DATE(b.date) = ?';
        queryParams.push(date);
      }
      
      // Add sorting
      query += ' ORDER BY b.date DESC, b.time DESC';
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM bookings b WHERE b.companyId = ?';
      const countParams = [companyId];
      
      if (status) {
        countQuery += ' AND b.status = ?';
        countParams.push(status);
      }
      
      if (date) {
        countQuery += ' AND DATE(b.date) = ?';
        countParams.push(date);
      }
      
      const [countResult] = await connection.execute(countQuery, countParams);
      const totalBookings = countResult[0].total;
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), offset);
      
      const [bookingsResult] = await connection.execute(query, queryParams);
      
      const companyBookings = bookingsResult.map(booking => ({
        id: booking.id,
        companyId: booking.companyId,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        servicePrice: parseFloat(booking.servicePrice),
        petOwnerId: booking.petOwnerId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        petId: booking.petId,
        petName: booking.petName,
        petType: booking.petType,
        employeeId: booking.employeeId,
        employeeName: booking.employeeName,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        notes: booking.notes,
        totalAmount: parseFloat(booking.totalAmount),
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }));

      res.json({
        success: true,
        data: companyBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBookings / limit),
          totalBookings: totalBookings,
          limit: parseInt(limit)
        }
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get bookings'
    });
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement database query to get specific booking
    res.status(404).json({
      error: 'Not Found',
      message: 'Booking not found'
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get booking'
    });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // TODO: Implement database update for booking status
    res.status(404).json({
      error: 'Not Found',
      message: 'Booking not found'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status'
    });
  }
});

// PUT /api/bookings/:id - Update booking details
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement database update for booking
    res.status(404).json({
      error: 'Not Found',
      message: 'Booking not found'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking'
    });
  }
});

// DELETE /api/bookings/:id - Cancel/delete booking
router.delete('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement booking cancellation/deletion
    res.status(404).json({
      error: 'Not Found',
      message: 'Booking not found'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete booking'
    });
  }
});

// GET /api/bookings/stats/overview - Get booking statistics overview
router.get('/stats/overview', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get current date ranges
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayString = new Date().toISOString().split('T')[0];
      
      // Get total bookings
      const [totalBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ?',
        [companyId]
      );
      
      // Get bookings by status
      const [statusStatsResult] = await connection.execute(
        `SELECT status, COUNT(*) as count 
         FROM bookings 
         WHERE companyId = ? 
         GROUP BY status`,
        [companyId]
      );
      
      // Get today's bookings
      const [todayBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ? AND DATE(date) = ?',
        [companyId, todayString]
      );
      
      // Get this week's bookings
      const [weekBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ? AND date >= ?',
        [companyId, startOfWeek]
      );
      
      // Get this month's bookings
      const [monthBookingsResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM bookings WHERE companyId = ? AND date >= ?',
        [companyId, startOfMonth]
      );
      
      // Get total revenue (completed bookings)
      const [totalRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "completed"',
        [companyId]
      );
      
      // Get pending revenue (confirmed but not completed bookings)
      const [pendingRevenueResult] = await connection.execute(
        'SELECT SUM(totalAmount) as total FROM bookings WHERE companyId = ? AND status = "confirmed"',
        [companyId]
      );
      
      // Process status stats
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      };
      
      statusStatsResult.forEach(stat => {
        if (statusCounts.hasOwnProperty(stat.status)) {
          statusCounts[stat.status] = stat.count;
        }
      });
      
      const stats = {
        totalBookings: totalBookingsResult[0].total || 0,
        pendingBookings: statusCounts.pending,
        confirmedBookings: statusCounts.confirmed,
        completedBookings: statusCounts.completed,
        cancelledBookings: statusCounts.cancelled,
        todayBookings: todayBookingsResult[0].total || 0,
        thisWeekBookings: weekBookingsResult[0].total || 0,
        thisMonthBookings: monthBookingsResult[0].total || 0,
        totalRevenue: parseFloat(totalRevenueResult[0].total) || 0,
        pendingRevenue: parseFloat(pendingRevenueResult[0].total) || 0
      };

      res.json({
        success: true,
        data: stats
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting booking stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get booking statistics'
    });
  }
});

export default router; 