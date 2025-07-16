import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// GET /api/services/public - Get all public services (for marketplace)
router.get('/public', async (req, res) => {
  try {
    const { category, petType, location, page = 1, limit = 20 } = req.query;

    // TODO: Implement database query to get public services
    // For now, return empty array
    const marketplaceServices = [];

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedServices = marketplaceServices.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedServices,
      count: paginatedServices.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(marketplaceServices.length / limit),
        totalServices: marketplaceServices.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting public services:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get public services'
    });
  }
});

// GET /api/services - Get all services for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    // TODO: Implement database query to get company services
    // For now, return empty array
    const companyServices = [];

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
    
    // TODO: Implement database query to get specific service
    res.status(404).json({
      error: 'Not Found',
      message: 'Service not found'
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
    if (!name || !description || !category || !price || !duration) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, description, category, price, and duration are required'
      });
    }

    // TODO: Implement database insertion for new service
    const newService = {
      id: `service_${Date.now()}`,
      companyId: req.user.uid,
      name,
      description,
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      petTypes: petTypes || ['Dog', 'Cat'],
      isActive: true,
      images: images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

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
    
    // TODO: Implement database update for service
    res.status(404).json({
      error: 'Not Found',
      message: 'Service not found'
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
    
    // TODO: Implement database deletion for service
    res.status(404).json({
      error: 'Not Found',
      message: 'Service not found'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete service'
    });
  }
});

export default router; 