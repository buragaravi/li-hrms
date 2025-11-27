const User = require('../../users/model/User');
const { generateToken } = require('../../users/controllers/userController');
const RoleAssignment = require('../../workspaces/model/RoleAssignment');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get user's workspaces
    let workspaces = [];
    let activeWorkspace = null;

    try {
      const assignments = await RoleAssignment.getUserWorkspaces(user._id);
      workspaces = assignments.map((assignment) => ({
        _id: assignment.workspaceId._id,
        name: assignment.workspaceId.name,
        code: assignment.workspaceId.code,
        type: assignment.workspaceId.type,
        description: assignment.workspaceId.description,
        theme: assignment.workspaceId.theme,
        modules: assignment.workspaceId.modules?.filter((m) => m.isEnabled) || [],
        defaultModuleCode: assignment.workspaceId.defaultModuleCode,
        role: assignment.role,
        isPrimary: assignment.isPrimary,
      }));

      // Determine active workspace
      activeWorkspace = user.activeWorkspaceId
        ? workspaces.find((w) => w._id.toString() === user.activeWorkspaceId.toString())
        : workspaces.find((w) => w.isPrimary) || workspaces[0];
    } catch (wsError) {
      console.log('Workspaces not configured yet:', wsError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: user.roles,
          department: user.department,
        },
        workspaces,
        activeWorkspace,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('department', 'name')
      .populate('activeWorkspaceId', 'name code type')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's workspaces
    let workspaces = [];
    let activeWorkspace = null;

    try {
      const assignments = await RoleAssignment.getUserWorkspaces(user._id);
      workspaces = assignments.map((assignment) => ({
        _id: assignment.workspaceId._id,
        name: assignment.workspaceId.name,
        code: assignment.workspaceId.code,
        type: assignment.workspaceId.type,
        description: assignment.workspaceId.description,
        theme: assignment.workspaceId.theme,
        modules: assignment.workspaceId.modules?.filter((m) => m.isEnabled) || [],
        defaultModuleCode: assignment.workspaceId.defaultModuleCode,
        role: assignment.role,
        isPrimary: assignment.isPrimary,
      }));

      // Determine active workspace
      activeWorkspace = user.activeWorkspaceId
        ? workspaces.find((w) => w._id.toString() === user.activeWorkspaceId._id?.toString())
        : workspaces.find((w) => w.isPrimary) || workspaces[0];
    } catch (wsError) {
      console.log('Workspaces not configured yet:', wsError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        workspaces,
        activeWorkspace,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const user = await User.findById(req.user.userId).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
};

