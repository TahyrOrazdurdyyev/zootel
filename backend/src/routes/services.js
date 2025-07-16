import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// Mock services data (in a real app, this would be in a database)
let servicesData = [
  {
    id: 'service_1',
    companyId: 'company_1',
    name: 'Premium Dog Grooming',
    description: 'Full service grooming including bath, nail trim, ear cleaning, and styling',
    category: 'Grooming',
    price: 85.00,
    duration: 120, // minutes
    petTypes: ['Dog'],
    isActive: true,
    images: ['https://via.placeholder.com/300x200?text=Dog+Grooming'],
    createdAt: '2023-01-15T10:00:00.000Z',
    updatedAt: '2023-01-15T10:00:00.000Z'
  },
  {
    id: 'service_2',
    companyId: 'company_1',
    name: 'Pet Sitting - Full Day',
    description: 'Professional pet sitting service in your home for up to 8 hours',
    category: 'Pet Sitting',
    price: 120.00,
    duration: 480, // minutes
    petTypes: ['Dog', 'Cat', 'Bird'],
    isActive: true,
    images: ['https://via.placeholder.com/300x200?text=Pet+Sitting'],
    createdAt: '2023-01-20T14:30:00.000Z',
    updatedAt: '2023-01-20T14:30:00.000Z'
  },
  {
    id: 'service_3',
    companyId: 'company_1',
    name: 'Dog Walking',
    description: '30-minute energetic walk for your furry friend',
    category: 'Exercise',
    price: 45.00,
    duration: 30, // minutes
    petTypes: ['Dog'],
    isActive: true,
    images: ['https://via.placeholder.com/300x200?text=Dog+Walking'],
    createdAt: '2023-02-01T09:15:00.000Z',
    updatedAt: '2023-02-01T09:15:00.000Z'
  }
];

// GET /api/services - Get all services for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    // Filter services by company (in a real app, this would be a database query)
    const companyServices = servicesData.filter(service => 
      service.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    res.json({
      success: true,
      data: companyServices,
      count: companyServices.length
    });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get services'
    });
  }
});

// GET /api/services/:id - Get a specific service
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const service = servicesData.find(s => 
      s.id === id && (s.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (!service) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get service'
    });
  }
});

// POST /api/services - Create a new service
router.post('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      duration,
      petTypes,
      images
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !price || !duration || !petTypes?.length) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, description, category, price, duration, and pet types are required'
      });
    }

    // Validate price and duration
    if (price <= 0 || duration <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Price and duration must be positive numbers'
      });
    }

    // Create new service
    const newService = {
      id: `service_${Date.now()}`,
      companyId: req.user.uid,
      name,
      description,
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      petTypes: Array.isArray(petTypes) ? petTypes : [petTypes],
      isActive: true,
      images: images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock data (in a real app, this would be saved to database)
    servicesData.push(newService);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create service'
    });
  }
});

// PUT /api/services/:id - Update a service
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      duration,
      petTypes,
      images,
      isActive
    } = req.body;

    // Find service
    const serviceIndex = servicesData.findIndex(s => 
      s.id === id && (s.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Service not found'
      });
    }

    // Update service
    const updatedService = {
      ...servicesData[serviceIndex],
      ...(name && { name }),
      ...(description && { description }),
      ...(category && { category }),
      ...(price && { price: parseFloat(price) }),
      ...(duration && { duration: parseInt(duration) }),
      ...(petTypes && { petTypes: Array.isArray(petTypes) ? petTypes : [petTypes] }),
      ...(images && { images }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString()
    };

    servicesData[serviceIndex] = updatedService;

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update service'
    });
  }
});

// DELETE /api/services/:id - Delete a service
router.delete('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;

    // Find service
    const serviceIndex = servicesData.findIndex(s => 
      s.id === id && (s.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Service not found'
      });
    }

    // Remove service
    const deletedService = servicesData.splice(serviceIndex, 1)[0];

    res.json({
      success: true,
      message: 'Service deleted successfully',
      data: deletedService
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete service'
    });
  }
});

// GET /api/services/categories/list - Get available service categories
router.get('/categories/list', verifyToken, async (req, res) => {
  try {
    const categories = [
      'Grooming',
      'Pet Sitting',
      'Dog Walking',
      'Veterinary',
      'Training',
      'Exercise',
      'Boarding',
      'Transportation',
      'Photography',
      'Other'
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get categories'
    });
  }
});

export default router; 