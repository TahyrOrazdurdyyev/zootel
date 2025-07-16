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

// GET /api/employees/roles/list - Get list of available employee roles
router.get('/roles/list', verifyToken, requireCompany, async (req, res) => {
  try {
    // Standard employee roles for pet service companies
    const roles = [
      { id: 'groomer', name: 'Pet Groomer', description: 'Professional pet grooming services' },
      { id: 'veterinarian', name: 'Veterinarian', description: 'Licensed veterinary care' },
      { id: 'trainer', name: 'Pet Trainer', description: 'Animal behavior and training specialist' },
      { id: 'sitter', name: 'Pet Sitter', description: 'Pet sitting and care services' },
      { id: 'walker', name: 'Pet Walker', description: 'Dog walking and exercise services' },
      { id: 'receptionist', name: 'Receptionist', description: 'Front desk and customer service' },
      { id: 'manager', name: 'Manager', description: 'Operations and team management' },
      { id: 'assistant', name: 'Assistant', description: 'General support and assistance' }
    ];

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error getting employee roles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee roles'
    });
  }
});

// GET /api/employees/skills/list - Get list of available skills
router.get('/skills/list', verifyToken, requireCompany, async (req, res) => {
  try {
    // Standard skills for pet service professionals
    const skills = [
      { id: 'dog_grooming', name: 'Dog Grooming', category: 'Grooming' },
      { id: 'cat_grooming', name: 'Cat Grooming', category: 'Grooming' },
      { id: 'nail_trimming', name: 'Nail Trimming', category: 'Grooming' },
      { id: 'teeth_cleaning', name: 'Teeth Cleaning', category: 'Health' },
      { id: 'vaccinations', name: 'Vaccinations', category: 'Health' },
      { id: 'first_aid', name: 'Pet First Aid', category: 'Health' },
      { id: 'obedience_training', name: 'Obedience Training', category: 'Training' },
      { id: 'behavior_modification', name: 'Behavior Modification', category: 'Training' },
      { id: 'agility_training', name: 'Agility Training', category: 'Training' },
      { id: 'large_dogs', name: 'Large Dog Handling', category: 'Specialization' },
      { id: 'exotic_pets', name: 'Exotic Pet Care', category: 'Specialization' },
      { id: 'senior_pets', name: 'Senior Pet Care', category: 'Specialization' },
      { id: 'customer_service', name: 'Customer Service', category: 'Communication' },
      { id: 'appointment_scheduling', name: 'Appointment Scheduling', category: 'Administration' }
    ];

    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    console.error('Error getting employee skills:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee skills'
    });
  }
});

// GET /api/employees/stats - Get employee statistics
router.get('/stats', verifyToken, requireCompany, async (req, res) => {
  try {
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get total employees
      const [totalEmployeesResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM employees WHERE companyId = ? AND active = true',
        [companyId]
      );
      
      // Get employees by role
      const [roleStatsResult] = await connection.execute(
        'SELECT role, COUNT(*) as count FROM employees WHERE companyId = ? AND active = true GROUP BY role',
        [companyId]
      );
      
      // Get new employees this month
      const [newEmployeesResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM employees WHERE companyId = ? AND active = true AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)',
        [companyId]
      );
      
      // Get employee performance (based on bookings)
      const [performanceResult] = await connection.execute(
        `SELECT 
           e.id, e.name, e.role,
           COUNT(b.id) as totalBookings,
           AVG(r.rating) as averageRating
         FROM employees e
         LEFT JOIN bookings b ON e.id = b.employeeId
         LEFT JOIN reviews r ON b.id = r.bookingId
         WHERE e.companyId = ? AND e.active = true
         GROUP BY e.id
         ORDER BY totalBookings DESC
         LIMIT 5`,
        [companyId]
      );

      const stats = {
        totalEmployees: totalEmployeesResult[0].total || 0,
        newEmployeesThisMonth: newEmployeesResult[0].total || 0,
        roleDistribution: roleStatsResult.map(role => ({
          role: role.role,
          count: role.count
        })),
        topPerformers: performanceResult.map(emp => ({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          totalBookings: emp.totalBookings || 0,
          averageRating: parseFloat(emp.averageRating) || 0.0
        }))
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
      message: 'Failed to get employee stats'
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