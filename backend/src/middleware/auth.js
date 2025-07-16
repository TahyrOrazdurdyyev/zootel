import admin from '../config/firebase.js';

// Middleware to verify Firebase ID token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No valid authorization header provided' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get additional user claims
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    
    // Attach user information to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userRecord.email,
      role: userRecord.customClaims?.role || 'pet_owner',
      emailVerified: decodedToken.email_verified || userRecord.emailVerified,
      displayName: userRecord.displayName || null,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token Expired', 
        message: 'ID token has expired' 
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        error: 'Token Revoked', 
        message: 'ID token has been revoked' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid token' 
    });
  }
};

// Middleware to check user role
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not authenticated' 
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}` 
      });
    }

    next();
  };
};

// Convenience middleware functions for specific roles
export const requireSuperadmin = requireRole(['superadmin']);
export const requireCompany = requireRole(['superadmin', 'pet_company']);
export const requireOwner = requireRole(['superadmin', 'pet_owner']);
export const requireAnyUser = requireRole(['superadmin', 'pet_company', 'pet_owner']);

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      req.user = null;
      return next();
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    
    // Attach user information to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userRecord.email,
      role: userRecord.customClaims?.role || 'pet_owner',
      emailVerified: decodedToken.email_verified || userRecord.emailVerified,
      displayName: userRecord.displayName || null,
    };

    next();
  } catch (error) {
    // If token verification fails, continue without user
    req.user = null;
    next();
  }
}; 