import express from 'express';
import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create waitlist table if it doesn't exist
const createWaitlistTable = async () => {
  try {
    const connection = await pool.getConnection();
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        type VARCHAR(50) NOT NULL DEFAULT 'mobile_app',
        status VARCHAR(50) DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email_type (email, type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    connection.release();
    console.log('✅ Waitlist table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating waitlist table:', error.message);
    return false;
  }
};

// Initialize table when module loads
createWaitlistTable();

// POST /api/waitlist - Join waitlist
router.post('/', async (req, res) => {
  try {
    const { email, phone, type = 'mobile_app' } = req.body;

    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate type
    const allowedTypes = ['mobile_app', 'business_app', 'general'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid waitlist type'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if email already exists for this type
      const [existingEntries] = await connection.execute(
        'SELECT id FROM waitlist WHERE email = ? AND type = ?',
        [email.trim().toLowerCase(), type]
      );

      if (existingEntries.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You are already on the waitlist'
        });
      }

      // Insert new waitlist entry
      const waitlistId = uuidv4();
      await connection.execute(
        `INSERT INTO waitlist (id, email, phone, type, status, createdAt) 
         VALUES (?, ?, ?, ?, 'active', NOW())`,
        [
          waitlistId,
          email.trim().toLowerCase(),
          phone ? phone.trim() : '',
          type
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Successfully joined the waitlist!',
        data: {
          id: waitlistId,
          email: email.trim().toLowerCase(),
          type: type
        }
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error joining waitlist:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'You are already on the waitlist'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist. Please try again.'
    });
  }
});

// GET /api/waitlist/stats - Get waitlist statistics (for superadmin)
router.get('/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Get total count by type
      const [totalStats] = await connection.execute(`
        SELECT 
          type,
          COUNT(*) as count,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as today,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as thisWeek,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as thisMonth
        FROM waitlist 
        WHERE status = 'active'
        GROUP BY type
      `);

      // Get overall total
      const [overallTotal] = await connection.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as today,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as thisWeek,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as thisMonth
        FROM waitlist 
        WHERE status = 'active'
      `);

      // Get recent signups
      const [recentSignups] = await connection.execute(`
        SELECT email, type, createdAt
        FROM waitlist 
        WHERE status = 'active'
        ORDER BY createdAt DESC 
        LIMIT 10
      `);

      // Format by type
      const statsByType = {};
      totalStats.forEach(stat => {
        statsByType[stat.type] = {
          total: stat.count,
          today: stat.today,
          thisWeek: stat.thisWeek,
          thisMonth: stat.thisMonth
        };
      });

      res.json({
        success: true,
        data: {
          overall: overallTotal[0] || { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
          byType: statsByType,
          recentSignups: recentSignups.map(signup => ({
            email: signup.email,
            type: signup.type,
            createdAt: signup.createdAt
          }))
        }
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting waitlist stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waitlist statistics'
    });
  }
});

// GET /api/waitlist - Get all waitlist entries (for superadmin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    const connection = await pool.getConnection();
    
    try {
      let query = 'SELECT * FROM waitlist WHERE status = "active"';
      const queryParams = [];

      // Apply type filter
      if (type && type !== 'all') {
        query += ' AND type = ?';
        queryParams.push(type);
      }

      // Apply search filter
      if (search) {
        query += ' AND email LIKE ?';
        queryParams.push(`%${search}%`);
      }

      // Get total count for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const [countResult] = await connection.execute(countQuery, queryParams);
      const totalEntries = countResult[0].total;

      // Add pagination
      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const [entries] = await connection.execute(query, queryParams);

      res.json({
        success: true,
        data: entries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEntries / parseInt(limit)),
          totalEntries: totalEntries,
          limit: parseInt(limit)
        }
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting waitlist entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waitlist entries'
    });
  }
});

export default router; 