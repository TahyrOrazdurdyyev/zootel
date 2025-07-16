import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_company role for most routes
const requireCompany = requireRole(['pet_company', 'superadmin']);

// Mock bookings data (in a real app, this would be in a database)
let bookingsData = [
  {
    id: 'booking_1',
    companyId: 'company_1',
    petOwnerId: 'owner_1',
    petOwnerName: 'John Smith',
    petOwnerEmail: 'john.smith@email.com',
    petOwnerPhone: '+1 (555) 123-4567',
    serviceId: 'service_1',
    serviceName: 'Premium Dog Grooming',
    petName: 'Buddy',
    petType: 'Dog',
    petBreed: 'Golden Retriever',
    petAge: '3 years',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: 120,
    price: 85.00,
    status: 'confirmed', // pending, confirmed, in_progress, completed, cancelled
    notes: 'First time customer. Dog is very friendly.',
    specialRequirements: 'Use hypoallergenic shampoo',
    createdAt: '2024-01-10T14:30:00.000Z',
    updatedAt: '2024-01-11T09:15:00.000Z'
  },
  {
    id: 'booking_2',
    companyId: 'company_1',
    petOwnerId: 'owner_2',
    petOwnerName: 'Sarah Johnson',
    petOwnerEmail: 'sarah.johnson@email.com',
    petOwnerPhone: '+1 (555) 234-5678',
    serviceId: 'service_2',
    serviceName: 'Pet Sitting - Full Day',
    petName: 'Whiskers',
    petType: 'Cat',
    petBreed: 'Persian',
    petAge: '5 years',
    date: '2024-01-16',
    time: '2:00 PM',
    duration: 480,
    price: 120.00,
    status: 'pending',
    notes: 'Cat is shy around strangers',
    specialRequirements: 'Feed at 6pm, medication at 8pm',
    createdAt: '2024-01-12T16:45:00.000Z',
    updatedAt: '2024-01-12T16:45:00.000Z'
  },
  {
    id: 'booking_3',
    companyId: 'company_1',
    petOwnerId: 'owner_3',
    petOwnerName: 'Mike Wilson',
    petOwnerEmail: 'mike.wilson@email.com',
    petOwnerPhone: '+1 (555) 345-6789',
    serviceId: 'service_3',
    serviceName: 'Dog Walking',
    petName: 'Rex',
    petType: 'Dog',
    petBreed: 'German Shepherd',
    petAge: '2 years',
    date: '2024-01-17',
    time: '8:00 AM',
    duration: 30,
    price: 45.00,
    status: 'completed',
    notes: 'Very energetic dog, loves to run',
    specialRequirements: 'Avoid other large dogs',
    createdAt: '2024-01-14T11:20:00.000Z',
    updatedAt: '2024-01-17T08:30:00.000Z'
  }
];

// GET /api/bookings - Get all bookings for the company
router.get('/', verifyToken, requireCompany, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;

    // Filter bookings by company
    let companyBookings = bookingsData.filter(booking => 
      booking.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    // Apply filters
    if (status) {
      companyBookings = companyBookings.filter(booking => booking.status === status);
    }

    if (date) {
      companyBookings = companyBookings.filter(booking => booking.date === date);
    }

    // Sort by date and time (newest first)
    companyBookings.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = companyBookings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(companyBookings.length / limit),
        totalBookings: companyBookings.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get bookings'
    });
  }
});

// GET /api/bookings/:id - Get a specific booking
router.get('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = bookingsData.find(b => 
      b.id === id && (b.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get booking'
    });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find booking
    const bookingIndex = bookingsData.findIndex(b => 
      b.id === id && (b.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (bookingIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }

    // Update status
    bookingsData[bookingIndex].status = status;
    bookingsData[bookingIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: bookingsData[bookingIndex]
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status'
    });
  }
});

// PUT /api/bookings/:id - Update booking details
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      time,
      notes,
      specialRequirements
    } = req.body;

    // Find booking
    const bookingIndex = bookingsData.findIndex(b => 
      b.id === id && (b.companyId === req.user.uid || req.user.role === 'superadmin')
    );

    if (bookingIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }

    // Update booking
    const updatedBooking = {
      ...bookingsData[bookingIndex],
      ...(date && { date }),
      ...(time && { time }),
      ...(notes !== undefined && { notes }),
      ...(specialRequirements !== undefined && { specialRequirements }),
      updatedAt: new Date().toISOString()
    };

    bookingsData[bookingIndex] = updatedBooking;

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking'
    });
  }
});

// GET /api/bookings/stats/summary - Get booking statistics summary
router.get('/stats/summary', verifyToken, requireCompany, async (req, res) => {
  try {
    // Filter bookings by company
    const companyBookings = bookingsData.filter(booking => 
      booking.companyId === req.user.uid || req.user.role === 'superadmin'
    );

    // Calculate statistics
    const stats = {
      total: companyBookings.length,
      pending: companyBookings.filter(b => b.status === 'pending').length,
      confirmed: companyBookings.filter(b => b.status === 'confirmed').length,
      inProgress: companyBookings.filter(b => b.status === 'in_progress').length,
      completed: companyBookings.filter(b => b.status === 'completed').length,
      cancelled: companyBookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: companyBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.price, 0),
      averagePrice: companyBookings.length > 0 
        ? companyBookings.reduce((sum, b) => sum + b.price, 0) / companyBookings.length 
        : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting booking stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get booking statistics'
    });
  }
});

// GET /api/bookings/calendar/:month - Get bookings for calendar view
router.get('/calendar/:month', verifyToken, requireCompany, async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Filter bookings by company and month
    const companyBookings = bookingsData.filter(booking => {
      const bookingMonth = booking.date.substring(0, 7); // Get YYYY-MM from YYYY-MM-DD
      return (booking.companyId === req.user.uid || req.user.role === 'superadmin') && 
             bookingMonth === month;
    });

    // Group bookings by date
    const calendarData = companyBookings.reduce((acc, booking) => {
      if (!acc[booking.date]) {
        acc[booking.date] = [];
      }
      acc[booking.date].push({
        id: booking.id,
        time: booking.time,
        serviceName: booking.serviceName,
        petOwnerName: booking.petOwnerName,
        petName: booking.petName,
        status: booking.status,
        duration: booking.duration
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: calendarData,
      month: month,
      totalBookings: companyBookings.length
    });
  } catch (error) {
    console.error('Error getting calendar bookings:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get calendar bookings'
    });
  }
});

export default router; 