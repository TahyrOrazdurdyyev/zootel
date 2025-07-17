import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Helper function to safely parse JSON
const safeJSONParse = (jsonString, defaultValue) => {
  // Handle null, undefined, or non-string values
  if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    console.error('Problematic JSON string:', JSON.stringify(jsonString));
    console.error('String length:', jsonString?.length);
    return defaultValue;
  }
};

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

      const employees = employeesResult.map(employee => {
        try {
          return {
            id: employee.id,
            companyId: employee.companyId,
            name: employee.name,
            email: employee.email,
            phone: employee.phone || '',
            position: employee.position,
            specialties: safeJSONParse(employee.specialties, []),
            workingHours: safeJSONParse(employee.workingHours, {}),
            active: Boolean(employee.active),
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt
          };
        } catch (error) {
          console.error('Error processing employee:', employee.id, error);
          console.error('Employee data:', {
            specialties: employee.specialties,
            workingHours: employee.workingHours
          });
          // Return a safe version of the employee
          return {
            id: employee.id,
            companyId: employee.companyId,
            name: employee.name,
            email: employee.email,
            phone: employee.phone || '',
            position: employee.position,
            specialties: [],
            workingHours: {},
            active: Boolean(employee.active),
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt
          };
        }
      });

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

// GET /api/employees/positions/list - Get predefined employee positions for dropdown
router.get('/positions/list', verifyToken, requireCompany, async (req, res) => {
  try {
    // Predefined positions for pet service companies
    const positions = [
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
      data: positions,
      message: 'Employee positions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting employee positions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee positions'
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
      
      // Get employees by position
      const [positionStatsResult] = await connection.execute(
        'SELECT position, COUNT(*) as count FROM employees WHERE companyId = ? AND active = true GROUP BY position',
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
           e.id, e.name, e.position,
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
        positionDistribution: positionStatsResult.map(position => ({
          position: position.position,
          count: position.count
        })),
        topPerformers: performanceResult.map(emp => ({
          id: emp.id,
          name: emp.name,
          position: emp.position,
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

// GET /api/employees/available - Get available employees for assignment
router.get('/available', verifyToken, requireCompany, async (req, res) => {
  try {
    const { date, time, duration = 60 } = req.query;
    const companyId = req.user.uid;
    const connection = await pool.getConnection();

    try {
      if (!date || !time) {
        // Return all active employees if no date/time specified
        const [employeesResult] = await connection.execute(
          'SELECT id, name, position, specialties FROM employees WHERE companyId = ? AND active = true ORDER BY name',
          [companyId]
        );

        const availableEmployees = employeesResult.map(employee => ({
          id: employee.id,
          name: employee.name,
          position: employee.position,
          specialties: safeJSONParse(employee.specialties, [])
        }));

        return res.json({
          success: true,
          data: availableEmployees,
          message: 'All active employees retrieved'
        });
      }

      // Check for conflicts with specific date/time
      const endTime = new Date(`${date} ${time}`);
      endTime.setMinutes(endTime.getMinutes() + parseInt(duration));
      const endTimeString = endTime.toTimeString().slice(0, 5);

      const [availableEmployeesResult] = await connection.execute(
        `SELECT e.id, e.name, e.position, e.specialties
         FROM employees e
         WHERE e.companyId = ? AND e.active = true
         AND e.id NOT IN (
           SELECT b.employeeId 
           FROM bookings b 
           WHERE b.employeeId IS NOT NULL 
           AND b.date = ? 
           AND b.status NOT IN ('cancelled', 'completed')
           AND (
             (b.time <= ? AND ADDTIME(b.time, SEC_TO_TIME(s.duration * 60)) > ?) 
             OR (b.time < ? AND ADDTIME(b.time, SEC_TO_TIME(s.duration * 60)) >= ?)
           )
         )
         ORDER BY e.name`,
        [companyId, date, time, time, endTimeString, endTimeString]
      );

      const availableEmployees = availableEmployeesResult.map(employee => ({
        id: employee.id,
        name: employee.name,
        position: employee.position,
        specialties: safeJSONParse(employee.specialties, [])
      }));

      res.json({
        success: true,
        data: availableEmployees,
        message: 'Available employees retrieved successfully'
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
        position: employee.position,
        specialties: safeJSONParse(employee.specialties, []),
        workingHours: safeJSONParse(employee.workingHours, {}),
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
      position,
      specialties,
      workingHours
    } = req.body;

    // Validate required fields
    if (!name || !email || !position) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and position are required'
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

      // Insert new employee (no Firebase UID - employees are company records)
      await connection.execute(
        `INSERT INTO employees (id, companyId, name, email, phone, position, specialties, workingHours, active, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          employeeId,
          companyId,
          name,
          email,
          phone || '',
          position,
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

      const newEmployee = {
        id: newEmployeeResult[0].id,
        companyId: newEmployeeResult[0].companyId,
        name: newEmployeeResult[0].name,
        email: newEmployeeResult[0].email,
        phone: newEmployeeResult[0].phone,
        position: newEmployeeResult[0].position,
        specialties: safeJSONParse(newEmployeeResult[0].specialties, []),
        workingHours: safeJSONParse(newEmployeeResult[0].workingHours, {}),
        active: Boolean(newEmployeeResult[0].active),
        createdAt: newEmployeeResult[0].createdAt,
        updatedAt: newEmployeeResult[0].updatedAt
      };

      res.status(201).json({
        success: true,
        data: newEmployee,
        message: 'Employee added successfully'
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
      if (updateData.position !== undefined) {
        updateFields.push('position = ?');
        updateValues.push(updateData.position);
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
        position: updatedEmployee.position,
        specialties: safeJSONParse(updatedEmployee.specialties, []),
        workingHours: safeJSONParse(updatedEmployee.workingHours, {}),
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

export default router; 