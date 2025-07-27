const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
});

// Authentication middleware with enhanced security
const auth = async (req, res, next) => {
    try {
        // Support multiple token sources
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token || 
                     req.query?.token;

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided, authorization denied',
                code: 'NO_TOKEN'
            });
        }

        // Verify token with additional options
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            maxAge: '24h' // Token expires after 24 hours
        });
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.userId)
            .select('-password -__v')
            .lean(); // Use lean() for better performance

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({ 
                success: false,
                message: 'Account is deactivated',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Check if token was issued before last password change
        if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
            return res.status(401).json({ 
                success: false,
                message: 'Token is invalid due to password change',
                code: 'PASSWORD_CHANGED'
            });
        }

        // Add user info to request
        req.user = {
            ...decoded,
            permissions: user.permissions || []
        };
        req.userDoc = user;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token format',
                code: 'INVALID_TOKEN'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

// Enhanced admin middleware with permission checking
const admin = (requiredPermission = null) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Admin access required',
                code: 'ADMIN_REQUIRED'
            });
        }

        // Check specific permission if provided
        if (requiredPermission && !req.user.permissions.includes(requiredPermission)) {
            return res.status(403).json({ 
                success: false,
                message: `Permission '${requiredPermission}' required`,
                code: 'PERMISSION_DENIED'
            });
        }

        next();
    };
};

// Enhanced owner or admin middleware with flexible resource checking
const ownerOrAdmin = (options = {}) => {
    const {
        resourceUserIdField = 'userId',
        allowSelfAccess = true,
        requiredPermission = null
    } = options;

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const isAdmin = req.user.role === 'admin';
        const isOwner = allowSelfAccess && 
                       (req.user.userId === req.params[resourceUserIdField] ||
                        req.user.userId === req.body[resourceUserIdField]);
        const hasPermission = requiredPermission ? 
                             req.user.permissions.includes(requiredPermission) : true;

        if (isAdmin || (isOwner && hasPermission)) {
            next();
        } else {
            res.status(403).json({ 
                success: false,
                message: 'Access denied - insufficient permissions',
                code: 'ACCESS_DENIED'
            });
        }
    };
};

// Optional authentication - continues even if no token
const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (!token) {
        return next(); // Continue without authentication
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
            .select('-password -__v')
            .lean();

        if (user && user.isActive) {
            req.user = decoded;
            req.userDoc = user;
        }
    } catch (error) {
        // Silently fail for optional auth
        console.warn('Optional auth failed:', error.message);
    }

    next();
};

module.exports = { 
    auth, 
    admin, 
    ownerOrAdmin, 
    optionalAuth,
    authLimiter 
};
