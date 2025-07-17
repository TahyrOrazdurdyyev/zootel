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
    const companyId = req.user.uid;
    const connection = await pool.getConnection();

    try {
      // Build query with optional status filter
      let query = 'SELECT * FROM employees WHERE companyId = ?';
      const queryParams = [companyId];

      if (status && status !== 'all') {
        query += ' AND active = ?';
        queryParams.push(status === 'active' ? 1 : 0);
      }

      query += ' ORDER BY createdAt DESC';

      // Get total count for pagination
      const countQuery = status && status !== 'all' 
        ? 'SELECT COUNT(*) as total FROM employees WHERE companyId = ? AND active = ?'
        : 'SELECT COUNT(*) as total FROM employees WHERE companyId = ?';
      
      const [countResult] = await connection.execute(countQuery, queryParams);
      const totalEmployees = countResult[0].total;

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const [employeesResult] = await connection.execute(query, queryParams);

      const employees = employeesResult.map(employee => ({
        id: employee.id,
        companyId: employee.companyId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
        specialties: employee.specialties ? JSON.parse(employee.specialties) : [],
        workingHours: employee.workingHours ? JSON.parse(employee.workingHours) : {},
        active: Boolean(employee.active),
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      }));

      res.json({
        success: true,
        data: employees,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEmployees / limit),
          totalEmployees: totalEmployees,
          limit: parseInt(limit)
        }
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employees'
    });
  }
});

// GET /api/employees/roles/list - Get predefined employee roles for dropdown
router.get('/roles/list', verifyToken, requireCompany, async (req, res) => {
  try {
    // Predefined roles for pet service companies
    const roles = [
      { id: 'veterinarian', name: 'Veterinarian', description: 'Licensed veterinary doctor' },
      { id: 'vet_technician', name: 'Veterinary Technician', description: 'Veterinary assistant and technician' },
      { id: 'groomer', name: 'Pet Groomer', description: 'Professional pet grooming specialist' },
      { id: 'trainer', name: 'Pet Trainer', description: 'Animal behavior and training specialist' },
      { id: 'caretaker', name: 'Pet Caretaker', description: 'General pet care and supervision' },
      { id: 'receptionist', name: 'Receptionist', description: 'Front desk and customer service' },
      { id: 'manager', name: 'Manager', description: 'Department or facility manager' },
      { id: 'assistant', name: 'Assistant', description: 'General assistant role' },
      { id: 'boarder', name: 'Pet Boarder', description: 'Pet boarding and overnight care specialist' },
      { id: 'walker', name: 'Pet Walker', description: 'Professional dog walking services' }
    ];

    res.json({
      success: true,
      data: roles,
      message: 'Employee roles retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting employee roles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee roles'
    });
  }
});

// GET /api/employees/skills/list - Get predefined employee skills for dropdown
router.get('/skills/list', verifyToken, requireCompany, async (req, res) => {
  try {
    // Predefined skills for pet service employees
    const skills = [
      { id: 'animal_handling', name: 'Animal Handling', category: 'Care' },
      { id: 'dog_grooming', name: 'Dog Grooming', category: 'Grooming' },
      { id: 'cat_grooming', name: 'Cat Grooming', category: 'Grooming' },
      { id: 'nail_trimming', name: 'Nail Trimming', category: 'Grooming' },
      { id: 'teeth_cleaning', name: 'Teeth Cleaning', category: 'Health' },
      { id: 'medication_admin', name: 'Medication Administration', category: 'Health' },
      { id: 'first_aid', name: 'Pet First Aid', category: 'Health' },
      { id: 'behavior_training', name: 'Behavior Training', category: 'Training' },
      { id: 'obedience_training', name: 'Obedience Training', category: 'Training' },
      { id: 'puppy_training', name: 'Puppy Training', category: 'Training' },
      { id: 'aggressive_handling', name: 'Aggressive Animal Handling', category: 'Specialized' },
      { id: 'elderly_care', name: 'Elderly Pet Care', category: 'Specialized' },
      { id: 'special_needs', name: 'Special Needs Care', category: 'Specialized' },
      { id: 'customer_service', name: 'Customer Service', category: 'Administrative' },
      { id: 'scheduling', name: 'Appointment Scheduling', category: 'Administrative' },
      { id: 'emergency_response', name: 'Emergency Response', category: 'Health' }
    ];

    res.json({
      success: true,
      data: skills,
      message: 'Employee skills retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting employee skills:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee skills'
    });
  }
});

// GET /api/employees/:id - Get specific employee
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      const [employeeResult] = await connection.execute(
        'SELECT * FROM employees WHERE id = ? AND companyId = ?',
        [id, companyId]
      );

      if (employeeResult.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Employee not found'
        });
      }

      const employee = employeeResult[0];
      const employeeData = {
        id: employee.id,
        companyId: employee.companyId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
        specialties: employee.specialties ? JSON.parse(employee.specialties) : [],
        workingHours: employee.workingHours ? JSON.parse(employee.workingHours) : {},
        active: Boolean(employee.active),
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      };

      res.json({
        success: true,
        data: employeeData
      });

    } finally {
      connection.release();
    }
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
      specialties,
      workingHours
    } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and role are required'
      });
    }

    const companyId = req.user.uid;
    const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection = await pool.getConnection();
    
    try {
      // Check if email already exists for this company
      const [existingEmployee] = await connection.execute(
        'SELECT id FROM employees WHERE email = ? AND companyId = ?',
        [email, companyId]
      );

      if (existingEmployee.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Employee with this email already exists'
        });
      }

      // Insert new employee
      await connection.execute(
        `INSERT INTO employees (id, companyId, firebaseUid, name, email, phone, role, specialties, workingHours, active, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          employeeId,
          companyId,
          '', // No Firebase UID - employees are not user accounts
          name,
          email,
          phone || '',
          role,
          JSON.stringify(specialties || []),
          JSON.stringify(workingHours || {}),
          true
        ]
      );

      // Get the created employee
      const [newEmployeeResult] = await connection.execute(
        'SELECT * FROM employees WHERE id = ?',
        [employeeId]
      );

      const newEmployee = newEmployeeResult[0];
      const employeeData = {
        id: newEmployee.id,
        companyId: newEmployee.companyId,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone || '',
        role: newEmployee.role,
        specialties: newEmployee.specialties ? JSON.parse(newEmployee.specialties) : [],
        workingHours: newEmployee.workingHours ? JSON.parse(newEmployee.workingHours) : {},
        active: Boolean(newEmployee.active),
        createdAt: newEmployee.createdAt,
        updatedAt: newEmployee.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        data: employeeData
      });

    } finally {
      connection.release();
    }
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
    const companyId = req.user.uid;
    const updateData = req.body;
    const connection = await pool.getConnection();
    
    try {
      // Check if employee exists and belongs to company
      const [existingEmployee] = await connection.execute(
        'SELECT * FROM employees WHERE id = ? AND companyId = ?',
        [id, companyId]
      );

      if (existingEmployee.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Employee not found'
        });
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];

      if (updateData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updateData.name);
      }
      if (updateData.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(updateData.email);
      }
      if (updateData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(updateData.phone);
      }
      if (updateData.role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(updateData.role);
      }
      if (updateData.specialties !== undefined) {
        updateFields.push('specialties = ?');
        updateValues.push(JSON.stringify(updateData.specialties));
      }
      if (updateData.workingHours !== undefined) {
        updateFields.push('workingHours = ?');
        updateValues.push(JSON.stringify(updateData.workingHours));
      }
      if (updateData.active !== undefined) {
        updateFields.push('active = ?');
        updateValues.push(Boolean(updateData.active));
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No valid fields provided for update'
        });
      }

      updateFields.push('updatedAt = NOW()');
      updateValues.push(id, companyId);

      const updateQuery = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ? AND companyId = ?`;
      await connection.execute(updateQuery, updateValues);

      // Get updated employee
      const [updatedEmployeeResult] = await connection.execute(
        'SELECT * FROM employees WHERE id = ? AND companyId = ?',
        [id, companyId]
      );

      const updatedEmployee = updatedEmployeeResult[0];
      const employeeData = {
        id: updatedEmployee.id,
        companyId: updatedEmployee.companyId,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone || '',
        role: updatedEmployee.role,
        specialties: updatedEmployee.specialties ? JSON.parse(updatedEmployee.specialties) : [],
        workingHours: updatedEmployee.workingHours ? JSON.parse(updatedEmployee.workingHours) : {},
        active: Boolean(updatedEmployee.active),
        createdAt: updatedEmployee.createdAt,
        updatedAt: updatedEmployee.updatedAt
      };

      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: employeeData
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update employee'
    });
  }
});

// DELETE /api/employees/:id - Remove employee (soft delete)
router.delete('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Check if employee exists and belongs to company
      const [existingEmployee] = await connection.execute(
        'SELECT * FROM employees WHERE id = ? AND companyId = ?',
        [id, companyId]
      );

      if (existingEmployee.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Employee not found'
        });
      }

      // Check if employee has pending bookings
      const [pendingBookings] = await connection.execute(
        'SELECT COUNT(*) as count FROM bookings WHERE employeeId = ? AND status IN ("pending", "confirmed")',
        [id]
      );

      if (pendingBookings[0].count > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot delete employee with pending bookings. Please reassign or complete bookings first.'
        });
      }

      // Soft delete - set active to false
      await connection.execute(
        'UPDATE employees SET active = false, updatedAt = NOW() WHERE id = ? AND companyId = ?',
        [id, companyId]
      );

      res.json({
        success: true,
        message: 'Employee removed successfully'
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete employee'
    });
  }
});

// GET /api/employees/available - Get available employees for booking assignment
router.get('/available', verifyToken, requireCompany, async (req, res) => {
  try {
    const { date, time, duration = 60 } = req.query;
    const companyId = req.user.uid;
    const connection = await pool.getConnection();

    if (!date || !time) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Date and time are required'
      });
    }

    try {
      // Get all active employees
      const [employeesResult] = await connection.execute(
        'SELECT * FROM employees WHERE companyId = ? AND active = true',
        [companyId]
      );

      // Calculate end time
      const [hours, minutes] = time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + parseInt(duration);
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

      // Check for conflicts with existing bookings
      const availableEmployees = [];
      
      for (const employee of employeesResult) {
        const [conflictingBookings] = await connection.execute(
          `SELECT COUNT(*) as count FROM bookings 
           WHERE employeeId = ? AND date = ? AND status IN ('confirmed', 'in_progress')
           AND (
             (time <= ? AND ADDTIME(time, SEC_TO_TIME(60 * (SELECT duration FROM services WHERE id = serviceId))) > ?) OR
             (time < ? AND ADDTIME(time, SEC_TO_TIME(60 * (SELECT duration FROM services WHERE id = serviceId))) >= ?)
           )`,
          [employee.id, date, time, time, endTime, endTime]
        );

        if (conflictingBookings[0].count === 0) {
          availableEmployees.push({
            id: employee.id,
            name: employee.name,
            role: employee.role,
            specialties: employee.specialties ? JSON.parse(employee.specialties) : []
          });
        }
      }

      res.json({
        success: true,
        data: availableEmployees
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting available employees:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get available employees'
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

export default router; 