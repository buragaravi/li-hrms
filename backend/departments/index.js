const express = require('express');
const router = express.Router();
const departmentController = require('./controllers/departmentController');
const { protect, authorize } = require('../authentication/middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get all departments
router.get('/', departmentController.getAllDepartments);

// Get single department
router.get('/:id', departmentController.getDepartment);

// Get department employees
router.get('/:id/employees', departmentController.getDepartmentEmployees);

// Create department (Super Admin, Sub Admin, HR)
router.post('/', authorize('super_admin', 'sub_admin', 'hr'), departmentController.createDepartment);

// Update department (Super Admin, Sub Admin, HR)
router.put('/:id', authorize('super_admin', 'sub_admin', 'hr'), departmentController.updateDepartment);

// Assign HOD (Super Admin, Sub Admin, HR)
router.put('/:id/assign-hod', authorize('super_admin', 'sub_admin', 'hr'), departmentController.assignHOD);

// Assign HR (Super Admin, Sub Admin)
router.put('/:id/assign-hr', authorize('super_admin', 'sub_admin'), departmentController.assignHR);

// Delete department (Super Admin, Sub Admin)
router.delete('/:id', authorize('super_admin', 'sub_admin'), departmentController.deleteDepartment);

module.exports = router;


