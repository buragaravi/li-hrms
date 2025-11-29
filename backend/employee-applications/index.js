/**
 * Employee Applications Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../authentication/middleware/authMiddleware');
const {
  createApplication,
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
} = require('./controllers/employeeApplicationController');

// All routes require authentication
router.use(protect);

// Create application (HR)
router.post('/', createApplication);

// Get all applications
router.get('/', getApplications);

// Get single application
router.get('/:id', getApplication);

// Approve application (Superadmin)
router.put('/:id/approve', approveApplication);

// Reject application (Superadmin)
router.put('/:id/reject', rejectApplication);

module.exports = router;


