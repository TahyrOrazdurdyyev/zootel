import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role
const requireCompany = requireRole(['pet_company', 'superadmin']);

// Mock customers data (in a real app, this would be in a database)
const customersData = [
  {
    id: 'customer_1',
    companyId: 'company_1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345',
    joinDate: '2023-08-15',
    lastBooking: '2024-01-15',
    totalBookings: 12,
    totalSpent: 1420.50,
    status: 'active',
    notes: 'Prefers morning appointments. Has an anxious golden retriever.',
    emergencyContact: {
      name: 'Jane Smith',
      phone: '+1 (555) 123-4568',
      relationship: 'Spouse'
    },
    pets: [
      {
        id: 'pet_1',
        name: 'Buddy',
        type: 'Dog',
        breed: 'Golden Retriever',
        age: '3 years',
        weight: '65 lbs',
        notes: 'Friendly but anxious around strangers'
      }
    ],
    preferences: {
      preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
      preferredTimes: ['Morning'],
      specialRequirements: ['Hypoallergenic products only']
    },
    createdAt: '2023-08-15T10:00:00.000Z',
    updatedAt: '2024-01-15T14:30:00.000Z'
  },
  {
    id: 'customer_2',
    companyId: 'company_1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave, City, State 12345',
    joinDate: '2023-09-20',
    lastBooking: '2024-01-10',
    totalBookings: 8,
    totalSpent: 960.00,
    status: 'active',
    notes: 'Very particular about grooming styles. Brings photos.',
    emergencyContact: {
      name: 'Mike Johnson',
      phone: '+1 (555) 234-5679',
      relationship: 'Brother'
    },
    pets: [
      {
        id: 'pet_2',
        name: 'Whiskers',
        type: 'Cat',
        breed: 'Persian',
        age: '5 years',
        weight: '12 lbs',
        notes: 'Shy around strangers, needs gentle handling'
      }
    ],
    preferences: {
      preferredDays: ['Thursday', 'Friday', 'Saturday'],
      preferredTimes: ['Afternoon'],
      specialRequirements: ['Quiet environment preferred']
    },
    createdAt: '2023-09-20T11:15:00.000Z',
    updatedAt: '2024-01-10T16:45:00.000Z'
  },
  {
    id: 'customer_3',
    companyId: 'company_1',
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine St, City, State 12345',
    joinDate: '2023-11-05',
    lastBooking: '2024-01-17',
    totalBookings: 5,
    totalSpent: 325.00,
    status: 'active',
    notes: 'New customer, very satisfied with services so far.',
    emergencyContact: {
      name: 'Lisa Wilson',
      phone: '+1 (555) 345-6790',
      relationship: 'Wife'
    },
    pets: [
      {
        id: 'pet_3',
        name: 'Rex',
        type: 'Dog',
        breed: 'German Shepherd',
        age: '2 years',
        weight: '75 lbs',
        notes: 'High energy, needs firm handling'
      }
    ],
    preferences: {
      preferredDays: ['Any'],
      preferredTimes: ['Morning', 'Afternoon'],
      specialRequirements: []
    },
    createdAt: '2023-11-05T09:30:00.000Z',
    updatedAt: '2024-01-17T08:20:00.000Z'
  }
];

// GET /api/customers - Get all customers for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Filter customers by company
    let companyCustomers = customersData.filter(customer => 
      customer.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    // Apply filters
    if (status) {
      companyCustomers = companyCustomers.filter(customer => customer.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      companyCustomers = companyCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.includes(search)
      );
    }

    // Sort customers
    companyCustomers.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'joinDate' || sortBy === 'lastBooking') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = companyCustomers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(companyCustomers.length / limit),
        totalCustomers: companyCustomers.length,
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

// GET /api/customers/:id - Get a specific customer
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const customer = customersData.find(c => 
      c.id === id && (c.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get customer'
    });
  }
});

// PUT /api/customers/:id - Update customer information
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      notes,
      emergencyContact,
      preferences,
      status
    } = req.body;

    // Find customer
    const customerIndex = customersData.findIndex(c => 
      c.id === id && (c.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (customerIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    // Update customer
    const updatedCustomer = {
      ...customersData[customerIndex],
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(notes !== undefined && { notes }),
      ...(emergencyContact && { emergencyContact }),
      ...(preferences && { preferences }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    customersData[customerIndex] = updatedCustomer;

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update customer'
    });
  }
});

// POST /api/customers/:id/notes - Add note to customer
router.post('/:id/notes', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Note content is required'
      });
    }

    // Find customer
    const customerIndex = customersData.findIndex(c => 
      c.id === id && (c.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (customerIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found'
      });
    }

    // Add note to existing notes
    const currentNotes = customersData[customerIndex].notes || '';
    const newNote = `[${new Date().toLocaleDateString()}] ${note}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;

    customersData[customerIndex].notes = updatedNotes;
    customersData[customerIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: {
        id: customersData[customerIndex].id,
        notes: updatedNotes
      }
    });
  } catch (error) {
    console.error('Error adding customer note:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add customer note'
    });
  }
});

// GET /api/customers/stats - Get customer statistics
router.get('/stats/overview', verifyToken, requireCompany, async (req, res) => {
  try {
    // Filter customers by company
    const companyCustomers = customersData.filter(customer => 
      customer.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    const stats = {
      totalCustomers: companyCustomers.length,
      activeCustomers: companyCustomers.filter(c => c.status === 'active').length,
      newCustomersThisMonth: companyCustomers.filter(c => {
        const joinDate = new Date(c.joinDate);
        const thisMonth = new Date();
        return joinDate.getMonth() === thisMonth.getMonth() && 
               joinDate.getFullYear() === thisMonth.getFullYear();
      }).length,
      totalRevenue: companyCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
      averageSpentPerCustomer: companyCustomers.length > 0 
        ? companyCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / companyCustomers.length
        : 0,
      totalBookings: companyCustomers.reduce((sum, c) => sum + c.totalBookings, 0),
      topCustomers: companyCustomers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          totalSpent: c.totalSpent,
          totalBookings: c.totalBookings
        })),
      recentCustomers: companyCustomers
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          joinDate: c.joinDate,
          totalBookings: c.totalBookings
        }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting customer stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get customer statistics'
    });
  }
});

export default router; 