const jwt = require('jsonwebtoken');
const User = require('../../users/model/User');

// Protect routes - verify JWT token
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
      req.user = decoded;
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
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user has required role
      const hasRole = roles.includes(user.role) || user.roles.some((role) => roles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `User role '${user.role}' is not authorized to access this route`,
        });
      }

      req.user.role = user.role;
      req.user.roles = user.roles;
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

