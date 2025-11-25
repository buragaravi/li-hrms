const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const { protect, authorize } = require('../authentication/middleware/authMiddleware');

// All routes are protected
router.use(protect);

// User routes
router.post('/register', authorize('super_admin', 'sub_admin', 'hr'), userController.registerUser);
router.get('/', authorize('super_admin', 'sub_admin', 'hr'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.put('/:id', authorize('super_admin', 'sub_admin', 'hr'), userController.updateUser);
router.delete('/:id', authorize('super_admin', 'sub_admin'), userController.deleteUser);

module.exports = router;

