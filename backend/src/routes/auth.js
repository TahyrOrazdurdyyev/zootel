import express from 'express';
import admin from '../config/firebase.js';
import { verifyToken, requireSuperadmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/auth/me - Get current user information
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information',
    });
  }
});

// POST /api/auth/register-role - Set user role during registration (self-service)
router.post('/register-role', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    const uid = req.user.uid;

    if (!role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role is required',
      });
    }

    // Only allow specific roles for self-registration
    const allowedRoles = ['pet_company', 'pet_owner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    // Check if user already has a role set (prevent role changes after initial setup)
    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.customClaims?.role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User role has already been set',
      });
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role });

    res.json({
      success: true,
      message: `Role '${role}' set successfully`,
      role: role
    });
  } catch (error) {
    console.error('Error setting user role during registration:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User does not exist',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set user role',
    });
  }
});

// POST /api/auth/set-role - Set user role (superadmin only)
router.post('/set-role', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'uid and role are required',
      });
    }

    const validRoles = ['superadmin', 'pet_company', 'pet_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role });

    res.json({
      success: true,
      message: `Role '${role}' set successfully for user ${uid}`,
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User with the specified uid does not exist',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set user role',
    });
  }
});

// GET /api/auth/users - List users (superadmin only)
router.get('/users', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { pageToken, maxResults = 1000 } = req.query;

    const listUsersResult = await admin.auth().listUsers(maxResults, pageToken);

    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      role: userRecord.customClaims?.role || 'pet_owner',
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    }));

    res.json({
      success: true,
      users,
      pageToken: listUsersResult.pageToken,
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list users',
    });
  }
});

// DELETE /api/auth/users/:uid - Delete user (superadmin only)
router.delete('/users/:uid', verifyToken, requireSuperadmin, async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User uid is required',
      });
    }

    // Prevent deleting self
    if (uid === req.user.uid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete your own account',
      });
    }

    await admin.auth().deleteUser(uid);

    res.json({
      success: true,
      message: `User ${uid} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User with the specified uid does not exist',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user',
    });
  }
});

// POST /api/auth/verify-token - Verify token endpoint (for testing)
router.post('/verify-token', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user,
  });
});

export default router; 