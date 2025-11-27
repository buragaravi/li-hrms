const jwt = require('jsonwebtoken');
const User = require('../../users/model/User');

// Protect routes - verify JWT token and load user data
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user and set on request (includes role)
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
        });
      }

      // Set user on request with all necessary fields
      req.user = {
        _id: user._id,
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.roles || [],
        department: user.department,
        departments: user.departments || [],
        employeeId: user.employeeId,
        employeeRef: user.employeeRef,
        activeWorkspaceId: user.activeWorkspaceId,
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in authentication',
      error: error.message,
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // User is already loaded by protect middleware
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Check if user has required role (check primary role and roles array)
      const hasRole = roles.includes(req.user.role) || 
        (req.user.roles && req.user.roles.some((role) => roles.includes(role)));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `User role '${req.user.role}' is not authorized to access this route`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error in authorization',
        error: error.message,
      });
    }
  };
};

