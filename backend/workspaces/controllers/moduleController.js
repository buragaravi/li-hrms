const Module = require('../model/Module');

/**
 * Module Controller
 * Handles CRUD operations for system modules
 */

// @desc    Get all modules
// @route   GET /api/workspaces/modules
// @access  Private (Super Admin)
exports.getModules = async (req, res) => {
  try {
    const { isActive, category } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (category) {
      filter.category = category;
    }

    const modules = await Module.find(filter).sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules',
    });
  }
};

// @desc    Get single module
// @route   GET /api/workspaces/modules/:id
// @access  Private (Super Admin)
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found',
      });
    }

    res.status(200).json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module',
    });
  }
};

// @desc    Create module
// @route   POST /api/workspaces/modules
// @access  Private (Super Admin)
exports.createModule = async (req, res) => {
  try {
    const { name, code, description, icon, route, category, availablePermissions, availableScopes, defaultPermissions, sortOrder } = req.body;

    // Check if module with same code exists
    const existingModule = await Module.findOne({ code: code.toUpperCase() });
    if (existingModule) {
      return res.status(400).json({
        success: false,
        error: 'Module with this code already exists',
      });
    }

    const module = await Module.create({
      name,
      code: code.toUpperCase(),
      description,
      icon,
      route,
      category,
      availablePermissions,
      availableScopes,
      defaultPermissions,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create module',
    });
  }
};

// @desc    Update module
// @route   PUT /api/workspaces/modules/:id
// @access  Private (Super Admin)
exports.updateModule = async (req, res) => {
  try {
    const { name, description, icon, route, category, availablePermissions, availableScopes, defaultPermissions, sortOrder, isActive } = req.body;

    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found',
      });
    }

    // Update fields
    if (name !== undefined) module.name = name;
    if (description !== undefined) module.description = description;
    if (icon !== undefined) module.icon = icon;
    if (route !== undefined) module.route = route;
    if (category !== undefined) module.category = category;
    if (availablePermissions !== undefined) module.availablePermissions = availablePermissions;
    if (availableScopes !== undefined) module.availableScopes = availableScopes;
    if (defaultPermissions !== undefined) module.defaultPermissions = defaultPermissions;
    if (sortOrder !== undefined) module.sortOrder = sortOrder;
    if (isActive !== undefined) module.isActive = isActive;

    await module.save();

    res.status(200).json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update module',
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/workspaces/modules/:id
// @access  Private (Super Admin)
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found',
      });
    }

    // Don't allow deleting system modules
    if (module.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system module',
      });
    }

    await module.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete module',
    });
  }
};

