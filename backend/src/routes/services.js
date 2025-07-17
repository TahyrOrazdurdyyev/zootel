import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';

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
    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // Get all services for the company with booking counts
      const [servicesResult] = await connection.execute(
        `SELECT s.*, 
                COUNT(b.id) as totalBookings,
                SUM(CASE WHEN b.status = 'completed' THEN b.totalAmount ELSE 0 END) as totalRevenue
         FROM services s 
         LEFT JOIN bookings b ON s.id = b.serviceId 
         WHERE s.companyId = ? 
         GROUP BY s.id
         ORDER BY s.createdAt DESC`,
        [companyId]
      );
      
      const companyServices = servicesResult.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        price: parseFloat(service.price),
        duration: service.duration,
        category: service.category || '',
        imageUrl: service.imageUrl || '',
        active: Boolean(service.active),
        totalBookings: service.totalBookings || 0,
        totalRevenue: parseFloat(service.totalRevenue) || 0.00,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      }));

      res.json({
        success: true,
        data: companyServices,
        count: companyServices.length
      });
      
    } finally {
      connection.release();
    }
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
      imageUrl
    } = req.body;

    // Validate required fields
    if (!name || !price || !duration) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, price, and duration are required'
      });
    }

    const companyId = req.user.uid;
    const serviceId = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection = await pool.getConnection();
    
    try {
      // Insert new service into database
      await connection.execute(
        `INSERT INTO services (id, companyId, name, description, price, duration, category, imageUrl, active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceId,
          companyId,
          name,
          description || '',
          parseFloat(price),
          parseInt(duration),
          category || '',
          imageUrl || '',
          true
        ]
      );
      
      // Get the created service
      const [serviceResult] = await connection.execute(
        'SELECT * FROM services WHERE id = ?',
        [serviceId]
      );
      
      const newService = serviceResult[0];
      
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: {
          id: newService.id,
          companyId: newService.companyId,
          name: newService.name,
          description: newService.description,
          price: parseFloat(newService.price),
          duration: newService.duration,
          category: newService.category,
          imageUrl: newService.imageUrl,
          active: Boolean(newService.active),
          createdAt: newService.createdAt,
          updatedAt: newService.updatedAt
        }
      });
      
    } finally {
      connection.release();
    }
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
      imageUrl,
      active
    } = req.body;

    const companyId = req.user.uid;
    const connection = await pool.getConnection();
    
    try {
      // First, check if the service exists and belongs to the company
      const [existingService] = await connection.execute(
        'SELECT * FROM services WHERE id = ? AND companyId = ?',
        [id, companyId]
      );
      
      if (existingService.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Service not found or you do not have permission to update it'
        });
      }

      // Update the service
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(category);
      }
      if (price !== undefined) {
        updateFields.push('price = ?');
        updateValues.push(parseFloat(price));
      }
      if (duration !== undefined) {
        updateFields.push('duration = ?');
        updateValues.push(parseInt(duration));
      }
      if (imageUrl !== undefined) {
        updateFields.push('imageUrl = ?');
        updateValues.push(imageUrl);
      }
      if (active !== undefined) {
        updateFields.push('active = ?');
        updateValues.push(Boolean(active));
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No valid fields provided for update'
        });
      }
      
      // Add updatedAt field
      updateFields.push('updatedAt = NOW()');
      updateValues.push(id, companyId);
      
      const updateQuery = `UPDATE services SET ${updateFields.join(', ')} WHERE id = ? AND companyId = ?`;
      await connection.execute(updateQuery, updateValues);
      
      // Get the updated service
      const [updatedService] = await connection.execute(
        'SELECT * FROM services WHERE id = ? AND companyId = ?',
        [id, companyId]
      );
      
      const service = updatedService[0];
      
      res.json({
        success: true,
        message: 'Service updated successfully',
        data: {
          id: service.id,
          companyId: service.companyId,
          name: service.name,
          description: service.description,
          price: parseFloat(service.price),
          duration: service.duration,
          category: service.category,
          imageUrl: service.imageUrl,
          active: Boolean(service.active),
          createdAt: service.createdAt,
          updatedAt: service.updatedAt
        }
      });
      
    } finally {
      connection.release();
    }
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