import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware to require pet_owner role for most routes
const requirePetOwner = requireRole(['pet_owner', 'superadmin']);

// Mock pet owner profiles data
let petOwnerProfiles = [
  {
    id: 'owner_1',
    userId: 'user_1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    emergencyContact: {
      name: 'Jane Smith',
      phone: '+1 (555) 123-4568',
      relationship: 'Spouse'
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: false
      },
      communication: 'email',
      autoBooking: false
    },
    joinedDate: '2023-01-15T10:00:00.000Z',
    lastActiveDate: '2024-01-15T14:30:00.000Z'
  }
];

// Mock pets data
let petsData = [
  {
    id: 'pet_1',
    ownerId: 'owner_1',
    name: 'Buddy',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: '3 years',
    weight: '65 lbs',
    gender: 'Male',
    color: 'Golden',
    microchipId: 'MC123456789',
    photos: [
      'https://via.placeholder.com/300x300?text=Buddy+1',
      'https://via.placeholder.com/300x300?text=Buddy+2'
    ],
    medicalInfo: {
      allergies: ['Chicken', 'Wheat'],
      medications: ['Daily vitamin'],
      conditions: [],
      vetInfo: {
        name: 'Happy Paws Veterinary',
        phone: '+1 (555) 987-6543',
        address: '456 Pet Lane, City, State'
      },
      lastCheckup: '2023-12-15'
    },
    behaviorNotes: 'Very friendly and energetic. Gets along well with other dogs.',
    specialNeeds: 'Needs daily exercise and mental stimulation.',
    createdAt: '2023-01-20T12:00:00.000Z',
    updatedAt: '2024-01-10T16:20:00.000Z'
  },
  {
    id: 'pet_2',
    ownerId: 'owner_1',
    name: 'Whiskers',
    type: 'Cat',
    breed: 'Persian',
    age: '5 years',
    weight: '12 lbs',
    gender: 'Female',
    color: 'White',
    microchipId: 'MC987654321',
    photos: [
      'https://via.placeholder.com/300x300?text=Whiskers+1'
    ],
    medicalInfo: {
      allergies: [],
      medications: [],
      conditions: ['Sensitive stomach'],
      vetInfo: {
        name: 'City Cat Clinic',
        phone: '+1 (555) 876-5432',
        address: '789 Feline Ave, City, State'
      },
      lastCheckup: '2023-11-20'
    },
    behaviorNotes: 'Shy around strangers but very affectionate with family.',
    specialNeeds: 'Special diet for sensitive stomach.',
    createdAt: '2023-03-10T09:30:00.000Z',
    updatedAt: '2024-01-05T11:15:00.000Z'
  }
];

// GET /api/pet-owners/profile - Get pet owner profile
router.get('/profile', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      // Create default profile if doesn't exist
      const newProfile = {
        id: `owner_${Date.now()}`,
        userId: req.user.uid,
        name: req.user.displayName || 'Pet Owner',
        email: req.user.email,
        phone: '',
        address: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: false
          },
          communication: 'email',
          autoBooking: false
        },
        joinedDate: new Date().toISOString(),
        lastActiveDate: new Date().toISOString()
      };
      
      petOwnerProfiles.push(newProfile);
      
      return res.json({
        success: true,
        data: newProfile
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting pet owner profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile'
    });
  }
});

// PUT /api/pet-owners/profile - Update pet owner profile
router.put('/profile', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      emergencyContact,
      preferences
    } = req.body;

    const profileIndex = petOwnerProfiles.findIndex(p => p.userId === req.user.uid);
    
    if (profileIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    // Update profile
    const updatedProfile = {
      ...petOwnerProfiles[profileIndex],
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(emergencyContact && { emergencyContact }),
      ...(preferences && { preferences }),
      lastActiveDate: new Date().toISOString()
    };

    petOwnerProfiles[profileIndex] = updatedProfile;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

// GET /api/pet-owners/pets - Get all pets for the owner
router.get('/pets', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    const ownerPets = petsData.filter(pet => pet.ownerId === profile.id);

    res.json({
      success: true,
      data: ownerPets,
      count: ownerPets.length
    });
  } catch (error) {
    console.error('Error getting pets:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get pets'
    });
  }
});

// POST /api/pet-owners/pets - Add a new pet
router.post('/pets', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    const {
      name,
      type,
      breed,
      age,
      weight,
      gender,
      color,
      microchipId,
      photos,
      medicalInfo,
      behaviorNotes,
      specialNeeds
    } = req.body;

    // Validate required fields
    if (!name || !type || !breed) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, type, and breed are required'
      });
    }

    const newPet = {
      id: `pet_${Date.now()}`,
      ownerId: profile.id,
      name,
      type,
      breed,
      age: age || 'Unknown',
      weight: weight || 'Unknown',
      gender: gender || 'Unknown',
      color: color || 'Unknown',
      microchipId: microchipId || '',
      photos: photos || [],
      medicalInfo: medicalInfo || {
        allergies: [],
        medications: [],
        conditions: [],
        vetInfo: {
          name: '',
          phone: '',
          address: ''
        },
        lastCheckup: ''
      },
      behaviorNotes: behaviorNotes || '',
      specialNeeds: specialNeeds || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    petsData.push(newPet);

    res.status(201).json({
      success: true,
      message: 'Pet added successfully',
      data: newPet
    });
  } catch (error) {
    console.error('Error adding pet:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add pet'
    });
  }
});

// PUT /api/pet-owners/pets/:id - Update pet information
router.put('/pets/:id', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    const petIndex = petsData.findIndex(pet => pet.id === id && pet.ownerId === profile.id);
    
    if (petIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pet not found'
      });
    }

    const updatedPet = {
      ...petsData[petIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    petsData[petIndex] = updatedPet;

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update pet'
    });
  }
});

// DELETE /api/pet-owners/pets/:id - Remove a pet
router.delete('/pets/:id', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    const petIndex = petsData.findIndex(pet => pet.id === id && pet.ownerId === profile.id);
    
    if (petIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pet not found'
      });
    }

    const deletedPet = petsData.splice(petIndex, 1)[0];

    res.json({
      success: true,
      message: 'Pet removed successfully',
      data: deletedPet
    });
  } catch (error) {
    console.error('Error removing pet:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove pet'
    });
  }
});

// GET /api/pet-owners/bookings - Get booking history for pet owner
router.get('/bookings', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    // Import booking data from bookings route (in real app, this would be database query)
    const mockBookings = [
      {
        id: 'booking_owner_1',
        petOwnerId: profile.id,
        companyId: 'company_1',
        companyName: 'Happy Paws Pet Services',
        serviceId: 'service_1',
        serviceName: 'Premium Dog Grooming',
        petId: 'pet_1',
        petName: 'Buddy',
        date: '2024-01-20',
        time: '10:00 AM',
        duration: 120,
        price: 85.00,
        status: 'confirmed',
        notes: 'Regular grooming appointment',
        specialRequirements: 'Use hypoallergenic shampoo',
        createdAt: '2024-01-15T10:00:00.000Z',
        companyRating: 4.8,
        companyAddress: '123 Pet Street, Pet City, PC 12345'
      },
      {
        id: 'booking_owner_2',
        petOwnerId: profile.id,
        companyId: 'company_1',
        companyName: 'Happy Paws Pet Services',
        serviceId: 'service_3',
        serviceName: 'Dog Walking',
        petId: 'pet_1',
        petName: 'Buddy',
        date: '2024-01-18',
        time: '8:00 AM',
        duration: 30,
        price: 45.00,
        status: 'completed',
        notes: 'Regular morning walk',
        specialRequirements: 'Avoid other large dogs',
        createdAt: '2024-01-16T08:00:00.000Z',
        companyRating: 4.8,
        companyAddress: '123 Pet Street, Pet City, PC 12345'
      }
    ];

    const { status, page = 1, limit = 10 } = req.query;

    let userBookings = mockBookings.filter(booking => booking.petOwnerId === profile.id);

    // Apply filters
    if (status) {
      userBookings = userBookings.filter(booking => booking.status === status);
    }

    // Sort by date (newest first)
    userBookings.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = userBookings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userBookings.length / limit),
        totalBookings: userBookings.length,
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

// POST /api/pet-owners/bookings - Create a new booking
router.post('/bookings', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    const {
      companyId,
      serviceId,
      petId,
      date,
      time,
      notes,
      specialRequirements
    } = req.body;

    // Validate required fields
    if (!companyId || !serviceId || !petId || !date || !time) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Company, service, pet, date, and time are required'
      });
    }

    // Verify pet belongs to this owner
    const pet = petsData.find(p => p.id === petId && p.ownerId === profile.id);
    if (!pet) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pet not found or does not belong to you'
      });
    }

    // Create new booking (in real app, this would also notify the company)
    const newBooking = {
      id: `booking_${Date.now()}`,
      petOwnerId: profile.id,
      petOwnerName: profile.name,
      petOwnerEmail: profile.email,
      petOwnerPhone: profile.phone,
      companyId,
      serviceId,
      petId,
      petName: pet.name,
      petType: pet.type,
      petBreed: pet.breed,
      petAge: pet.age,
      date,
      time,
      status: 'pending',
      notes: notes || '',
      specialRequirements: specialRequirements || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create booking'
    });
  }
});

// GET /api/pet-owners/dashboard - Get pet owner dashboard data
router.get('/dashboard', verifyToken, requirePetOwner, async (req, res) => {
  try {
    const profile = petOwnerProfiles.find(p => p.userId === req.user.uid);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    const ownerPets = petsData.filter(pet => pet.ownerId === profile.id);
    
    // Mock dashboard data
    const dashboardData = {
      totalPets: ownerPets.length,
      upcomingBookings: 2,
      totalBookings: 15,
      favoriteCompanies: 3,
      recentActivity: [
        {
          id: 'activity_1',
          type: 'booking_confirmed',
          message: 'Booking confirmed for Buddy\'s grooming',
          date: '2024-01-15',
          icon: '✅'
        },
        {
          id: 'activity_2',
          type: 'booking_completed',
          message: 'Dog walking completed for Buddy',
          date: '2024-01-14',
          icon: '🚶‍♂️'
        },
        {
          id: 'activity_3',
          type: 'pet_added',
          message: 'Added new pet profile for Whiskers',
          date: '2024-01-12',
          icon: '🐱'
        }
      ],
      upcomingAppointments: [
        {
          id: 'booking_upcoming_1',
          serviceName: 'Premium Dog Grooming',
          companyName: 'Happy Paws Pet Services',
          petName: 'Buddy',
          date: '2024-01-20',
          time: '10:00 AM',
          status: 'confirmed'
        },
        {
          id: 'booking_upcoming_2',
          serviceName: 'Pet Sitting',
          companyName: 'Pet Care Plus',
          petName: 'Whiskers',
          date: '2024-01-22',
          time: '2:00 PM',
          status: 'pending'
        }
      ],
      petHealthReminders: [
        {
          id: 'reminder_1',
          petName: 'Buddy',
          type: 'vaccination',
          message: 'Annual vaccination due soon',
          dueDate: '2024-02-15',
          priority: 'high'
        },
        {
          id: 'reminder_2',
          petName: 'Whiskers',
          type: 'checkup',
          message: 'Regular health checkup recommended',
          dueDate: '2024-03-01',
          priority: 'medium'
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get dashboard data'
    });
  }
});

export default router; 