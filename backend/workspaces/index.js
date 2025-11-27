const express = require('express');
const router = express.Router();
const workspaceController = require('./controllers/workspaceController');
const moduleController = require('./controllers/moduleController');
const { protect, authorize } = require('../authentication/middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ==========================================
// USER-FACING ROUTES (must come before /:id routes)
// ==========================================

// Get current user's workspaces
router.get('/my-workspaces', workspaceController.getMyWorkspaces);

// Switch active workspace
router.post('/switch', workspaceController.switchWorkspace);

// ==========================================
// MODULE ROUTES (Super Admin only)
// ==========================================

router.get('/modules', authorize('super_admin'), moduleController.getModules);
router.get('/modules/:id', authorize('super_admin'), moduleController.getModule);
router.post('/modules', authorize('super_admin'), moduleController.createModule);
router.put('/modules/:id', authorize('super_admin'), moduleController.updateModule);
router.delete('/modules/:id', authorize('super_admin'), moduleController.deleteModule);

// ==========================================
// WORKSPACE ROUTES (Super Admin only for management)
// ==========================================

// Get all workspaces
router.get('/', authorize('super_admin', 'sub_admin'), workspaceController.getWorkspaces);

// Get single workspace
router.get('/:id', workspaceController.getWorkspace);

// Create workspace
router.post('/', authorize('super_admin'), workspaceController.createWorkspace);

// Update workspace
router.put('/:id', authorize('super_admin'), workspaceController.updateWorkspace);

// Delete workspace
router.delete('/:id', authorize('super_admin'), workspaceController.deleteWorkspace);

// ==========================================
// WORKSPACE MODULE MANAGEMENT
// ==========================================

// Add module to workspace
router.post('/:id/modules', authorize('super_admin'), workspaceController.addModuleToWorkspace);

// Update module in workspace
router.put('/:id/modules/:moduleCode', authorize('super_admin'), workspaceController.updateWorkspaceModule);

// Remove module from workspace
router.delete('/:id/modules/:moduleCode', authorize('super_admin'), workspaceController.removeModuleFromWorkspace);

// ==========================================
// WORKSPACE USER MANAGEMENT
// ==========================================

// Get users in workspace
router.get('/:id/users', authorize('super_admin', 'sub_admin'), workspaceController.getWorkspaceUsers);

// Assign user to workspace
router.post('/:id/assign', authorize('super_admin', 'sub_admin'), workspaceController.assignUserToWorkspace);

// Remove user from workspace
router.delete('/:id/users/:userId', authorize('super_admin', 'sub_admin'), workspaceController.removeUserFromWorkspace);

module.exports = router;

