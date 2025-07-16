import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/employees - Get all employees for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // TODO: Implement database query to get company employees
    // For now, return empty array
    let companyEmployees = [];

    // Apply status filter (when implementing database queries)
    if (status) {
      companyEmployees = companyEmployees.filter(employee => employee.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEmployees = companyEmployees.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedEmployees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(companyEmployees.length / limit),
        totalEmployees: companyEmployees.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employees'
    });
  }
});

// GET /api/employees/:id - Get specific employee
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement database query to get specific employee
    res.status(404).json({
      error: 'Not Found',
      message: 'Employee not found'
    });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee'
    });
  }
});

// POST /api/employees - Add new employee
router.post('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      skills,
      specializations,
      availability,
      emergencyContact,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and role are required'
      });
    }

    // TODO: Implement database insertion for new employee
    const newEmployee = {
      id: `employee_${Date.now()}`,
      companyId: req.user.uid,
      name,
      email,
      phone: phone || '',
      role,
      skills: skills || [],
      specializations: specializations || [],
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
      availability: availability || {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '', end: '', available: false },
        sunday: { start: '', end: '', available: false }
      },
      performance: {
        rating: 0.0,
        completedAppointments: 0,
        customerRating: 0.0,
        punctualityScore: 100
      },
      profileImage: '',
      emergencyContact: emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add employee'
    });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement database update for employee
    res.status(404).json({
      error: 'Not Found',
      message: 'Employee not found'
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update employee'
    });
  }
});

// DELETE /api/employees/:id - Remove employee
router.delete('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement employee removal (soft delete)
    res.status(404).json({
      error: 'Not Found',
      message: 'Employee not found'
    });
  } catch (error) {
    console.error('Error removing employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove employee'
    });
  }
});

// PUT /api/employees/:id/availability - Update employee availability
router.put('/:id/availability', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Availability data is required'
      });
    }

    // TODO: Implement database update for employee availability
    res.status(404).json({
      error: 'Not Found',
      message: 'Employee not found'
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update availability'
    });
  }
});

// GET /api/employees/stats - Get employee statistics (main endpoint)
router.get('/stats', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get total employees
      const [totalEmployeesResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM employees WHERE companyId = ?',
        [companyId]
      );
      
      // Get active employees
      const [activeEmployeesResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM employees WHERE companyId = ? AND active = true',
        [companyId]
      );
      
      // Get inactive employees
      const [inactiveEmployeesResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM employees WHERE companyId = ? AND active = false',
        [companyId]
      );
      
      // Get total completed appointments by all employees
      const [completedAppointmentsResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM bookings 
         WHERE companyId = ? AND status = 'completed' AND employeeId IS NOT NULL`,
        [companyId]
      );
      
      // Calculate average employee rating based on bookings they handled
      const [employeeRatingResult] = await connection.execute(
        `SELECT AVG(r.rating) as avgRating 
         FROM reviews r 
         JOIN bookings b ON r.bookingId = b.id 
         WHERE b.companyId = ? AND b.employeeId IS NOT NULL`,
        [companyId]
      );
      
      const stats = {
        totalEmployees: totalEmployeesResult[0].total || 0,
        activeEmployees: activeEmployeesResult[0].total || 0,
        inactiveEmployees: inactiveEmployeesResult[0].total || 0,
        onLeaveEmployees: 0, // Could be implemented with a separate status field
        averageRating: parseFloat(employeeRatingResult[0].avgRating) || 0.0,
        totalCompletedAppointments: completedAppointmentsResult[0].total || 0
      };

      res.json({
        success: true,
        data: stats
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting employee stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee statistics'
    });
  }
});

// GET /api/employees/stats/overview - Alias for backward compatibility
router.get('/stats/overview', verifyToken, requireCompany, async (req, res) => {
  try {
    // Same logic as main stats endpoint
    const stats = {
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      onLeaveEmployees: 0,
      averageRating: 0.0,
      totalCompletedAppointments: 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting employee stats overview:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee statistics'
    });
  }
});

export default router; 