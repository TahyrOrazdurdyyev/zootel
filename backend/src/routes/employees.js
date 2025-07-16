import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// Mock employees data (in a real app, this would be in a database)
const employeesData = [
  {
    id: 'employee_1',
    companyId: 'company_1',
    name: 'Sarah Johnson',
    email: 'sarah.j@happypaws.com',
    phone: '+1 (555) 234-5678',
    role: 'Senior Groomer',
    skills: ['Dog Grooming', 'Cat Grooming', 'Nail Trimming', 'Styling'],
    specializations: ['Large Dogs', 'Anxious Pets'],
    hireDate: '2023-03-15',
    status: 'active', // active, inactive, on_leave
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '16:00', available: true },
      sunday: { start: '', end: '', available: false }
    },
    performance: {
      rating: 4.9,
      completedAppointments: 145,
      customerRating: 4.8,
      punctualityScore: 98
    },
    profileImage: 'https://via.placeholder.com/150?text=SJ',
    emergencyContact: {
      name: 'Mike Johnson',
      phone: '+1 (555) 234-5679',
      relationship: 'Spouse'
    },
    notes: 'Excellent with difficult dogs. Prefers morning shifts.',
    createdAt: '2023-03-15T10:00:00.000Z',
    updatedAt: '2024-01-15T14:30:00.000Z'
  },
  {
    id: 'employee_2',
    companyId: 'company_1',
    name: 'Alex Rodriguez',
    email: 'alex.r@happypaws.com',
    phone: '+1 (555) 345-6789',
    role: 'Pet Care Assistant',
    skills: ['Pet Sitting', 'Dog Walking', 'Basic Grooming', 'Pet Transportation'],
    specializations: ['Small Dogs', 'Senior Pets'],
    hireDate: '2023-06-01',
    status: 'active',
    availability: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '10:00', end: '18:00', available: true }
    },
    performance: {
      rating: 4.6,
      completedAppointments: 89,
      customerRating: 4.7,
      punctualityScore: 95
    },
    profileImage: 'https://via.placeholder.com/150?text=AR',
    emergencyContact: {
      name: 'Maria Rodriguez',
      phone: '+1 (555) 345-6790',
      relationship: 'Mother'
    },
    notes: 'Great with elderly pets. Very reliable for weekend work.',
    createdAt: '2023-06-01T10:00:00.000Z',
    updatedAt: '2024-01-12T09:15:00.000Z'
  }
];

// Mock employee assignments (employee to appointment assignments)
const employeeAssignments = [
  {
    id: 'assignment_1',
    employeeId: 'employee_1',
    appointmentId: 'booking_1',
    assignedDate: '2024-01-15T10:00:00.000Z',
    status: 'assigned' // assigned, completed, cancelled
  },
  {
    id: 'assignment_2',
    employeeId: 'employee_2',
    appointmentId: 'booking_3',
    assignedDate: '2024-01-17T08:00:00.000Z',
    status: 'completed'
  }
];

// Available roles for employees
const employeeRoles = [
  'Manager',
  'Senior Groomer',
  'Groomer',
  'Pet Care Assistant',
  'Dog Trainer',
  'Veterinary Assistant',
  'Receptionist',
  'Transportation Specialist'
];

// Available skills
const availableSkills = [
  'Dog Grooming',
  'Cat Grooming',
  'Pet Sitting',
  'Dog Walking',
  'Dog Training',
  'Pet Transportation',
  'Nail Trimming',
  'Ear Cleaning',
  'Styling',
  'Basic First Aid',
  'Customer Service',
  'Appointment Scheduling'
];

// GET /api/employees - Get all employees for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;

    // Filter employees by company
    let companyEmployees = employeesData.filter(employee => 
      employee.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    // Apply filters
    if (status) {
      companyEmployees = companyEmployees.filter(employee => employee.status === status);
    }

    if (role) {
      companyEmployees = companyEmployees.filter(employee => 
        employee.role.toLowerCase().includes(role.toLowerCase())
      );
    }

    // Sort by hire date (newest first)
    companyEmployees.sort((a, b) => new Date(b.hireDate) - new Date(a.hireDate));

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

// GET /api/employees/:id - Get a specific employee
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = employeesData.find(e => 
      e.id === id && (e.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (!employee) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Employee not found'
      });
    }

    // Get employee assignments
    const assignments = employeeAssignments.filter(a => a.employeeId === id);

    res.json({
      success: true,
      data: {
        ...employee,
        assignments
      }
    });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee'
    });
  }
});

// POST /api/employees - Add a new employee
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
    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, phone, and role are required'
      });
    }

    // Check if email already exists
    const existingEmployee = employeesData.find(e => 
      e.email.toLowerCase() === email.toLowerCase() && 
      e.companyId === req.user.uid
    );

    if (existingEmployee) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'An employee with this email already exists'
      });
    }

    // Create new employee
    const newEmployee = {
      id: `employee_${Date.now()}`,
      companyId: req.user.uid,
      name,
      email,
      phone,
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
        rating: 0,
        completedAppointments: 0,
        customerRating: 0,
        punctualityScore: 100
      },
      profileImage: `https://via.placeholder.com/150?text=${name.split(' ').map(n => n[0]).join('')}`,
      emergencyContact: emergencyContact || { name: '', phone: '', relationship: '' },
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock data (in a real app, this would be saved to database)
    employeesData.push(newEmployee);

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

// PUT /api/employees/:id - Update employee details
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      skills,
      specializations,
      status,
      availability,
      emergencyContact,
      notes
    } = req.body;

    // Find employee
    const employeeIndex = employeesData.findIndex(e => 
      e.id === id && (e.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Employee not found'
      });
    }

    // Check if email conflicts with another employee
    if (email) {
      const existingEmployee = employeesData.find(e => 
        e.email.toLowerCase() === email.toLowerCase() && 
        e.companyId === req.user.uid && 
        e.id !== id
      );

      if (existingEmployee) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'An employee with this email already exists'
        });
      }
    }

    // Update employee
    const updatedEmployee = {
      ...employeesData[employeeIndex],
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(role && { role }),
      ...(skills && { skills }),
      ...(specializations && { specializations }),
      ...(status && { status }),
      ...(availability && { availability }),
      ...(emergencyContact && { emergencyContact }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString()
    };

    employeesData[employeeIndex] = updatedEmployee;

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
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

    // Find employee
    const employeeIndex = employeesData.findIndex(e => 
      e.id === id && (e.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Employee not found'
      });
    }

    // Check if employee has active assignments
    const activeAssignments = employeeAssignments.filter(a => 
      a.employeeId === id && a.status === 'assigned'
    );

    if (activeAssignments.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete employee with active appointments. Please reassign or complete appointments first.'
      });
    }

    // Remove employee
    const removedEmployee = employeesData.splice(employeeIndex, 1)[0];

    // Remove all assignments for this employee
    for (let i = employeeAssignments.length - 1; i >= 0; i--) {
      if (employeeAssignments[i].employeeId === id) {
        employeeAssignments.splice(i, 1);
      }
    }

    res.json({
      success: true,
      message: 'Employee removed successfully',
      data: removedEmployee
    });
  } catch (error) {
    console.error('Error removing employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove employee'
    });
  }
});

// PUT /api/employees/:id/assign - Assign employee to appointment
router.put('/:id/assign', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Appointment ID is required'
      });
    }

    // Check if employee exists
    const employee = employeesData.find(e => 
      e.id === id && (e.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (!employee) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Employee not found'
      });
    }

    // Check if employee is available
    if (employee.status !== 'active') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Employee is not available for assignment'
      });
    }

    // Check if assignment already exists
    const existingAssignment = employeeAssignments.find(a => 
      a.appointmentId === appointmentId
    );

    if (existingAssignment) {
      // Update existing assignment
      existingAssignment.employeeId = id;
      existingAssignment.assignedDate = new Date().toISOString();
    } else {
      // Create new assignment
      const newAssignment = {
        id: `assignment_${Date.now()}`,
        employeeId: id,
        appointmentId,
        assignedDate: new Date().toISOString(),
        status: 'assigned'
      };
      employeeAssignments.push(newAssignment);
    }

    res.json({
      success: true,
      message: 'Employee assigned successfully',
      data: {
        employeeId: id,
        appointmentId,
        assignedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error assigning employee:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to assign employee'
    });
  }
});

// GET /api/employees/roles/list - Get available employee roles
router.get('/roles/list', verifyToken, requireCompany, async (req, res) => {
  try {
    res.json({
      success: true,
      data: employeeRoles
    });
  } catch (error) {
    console.error('Error getting employee roles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee roles'
    });
  }
});

// GET /api/employees/skills/list - Get available skills
router.get('/skills/list', verifyToken, requireCompany, async (req, res) => {
  try {
    res.json({
      success: true,
      data: availableSkills
    });
  } catch (error) {
    console.error('Error getting skills:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get skills'
    });
  }
});

// GET /api/employees/stats - Get employee statistics
router.get('/stats', verifyToken, requireCompany, async (req, res) => {
  try {
    // Filter employees by company
    const companyEmployees = employeesData.filter(employee => 
      employee.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    const stats = {
      totalEmployees: companyEmployees.length,
      activeEmployees: companyEmployees.filter(e => e.status === 'active').length,
      inactiveEmployees: companyEmployees.filter(e => e.status === 'inactive').length,
      onLeave: companyEmployees.filter(e => e.status === 'on_leave').length,
      averageRating: companyEmployees.length > 0 
        ? (companyEmployees.reduce((sum, e) => sum + e.performance.rating, 0) / companyEmployees.length).toFixed(1)
        : 0,
      totalCompletedAppointments: companyEmployees.reduce((sum, e) => sum + e.performance.completedAppointments, 0),
      averagePunctuality: companyEmployees.length > 0
        ? (companyEmployees.reduce((sum, e) => sum + e.performance.punctualityScore, 0) / companyEmployees.length).toFixed(1)
        : 0,
      topPerformers: companyEmployees
        .sort((a, b) => b.performance.rating - a.performance.rating)
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          name: e.name,
          role: e.role,
          rating: e.performance.rating,
          completedAppointments: e.performance.completedAppointments
        }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting employee stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get employee statistics'
    });
  }
});

export default router; 