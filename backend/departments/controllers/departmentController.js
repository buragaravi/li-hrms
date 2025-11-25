const Department = require('../model/Department');
const User = require('../../users/model/User');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getAllDepartments = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const departments = await Department.find(query)
      .populate('hod', 'name email role')
      .populate('hr', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message,
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hod', 'name email role')
      .populate('hr', 'name email role')
      .populate('createdBy', 'name email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message,
    });
  }
};

// @desc    Get department employees
// @route   GET /api/departments/:id/employees
// @access  Private
exports.getDepartmentEmployees = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const employees = await User.find({ department: req.params.id })
      .select('-password')
      .populate('department', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching department employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department employees',
      error: error.message,
    });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Super Admin, Sub Admin, HR)
exports.createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      hod,
      hr,
      attendanceConfig,
      permissionPolicy,
      autoDeductionRules,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }

    // Validate HOD if provided
    if (hod) {
      const hodUser = await User.findById(hod);
      if (!hodUser) {
        return res.status(400).json({
          success: false,
          message: 'HOD user not found',
        });
      }
    }

    // Validate HR if provided
    if (hr) {
      const hrUser = await User.findById(hr);
      if (!hrUser) {
        return res.status(400).json({
          success: false,
          message: 'HR user not found',
        });
      }
    }

    const department = await Department.create({
      name,
      code,
      description,
      hod: hod || null,
      hr: hr || null,
      attendanceConfig: attendanceConfig || {},
      permissionPolicy: permissionPolicy || {},
      autoDeductionRules: autoDeductionRules || [],
      createdBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message,
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Super Admin, Sub Admin, HR)
exports.updateDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      hod,
      hr,
      attendanceConfig,
      permissionPolicy,
      autoDeductionRules,
      isActive,
    } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Validate HOD if provided
    if (hod) {
      const hodUser = await User.findById(hod);
      if (!hodUser) {
        return res.status(400).json({
          success: false,
          message: 'HOD user not found',
        });
      }
    }

    // Validate HR if provided
    if (hr) {
      const hrUser = await User.findById(hr);
      if (!hrUser) {
        return res.status(400).json({
          success: false,
          message: 'HR user not found',
        });
      }
    }

    // Update fields
    if (name) department.name = name;
    if (code !== undefined) department.code = code;
    if (description !== undefined) department.description = description;
    if (hod !== undefined) department.hod = hod || null;
    if (hr !== undefined) department.hr = hr || null;
    if (attendanceConfig) department.attendanceConfig = { ...department.attendanceConfig, ...attendanceConfig };
    if (permissionPolicy) department.permissionPolicy = { ...department.permissionPolicy, ...permissionPolicy };
    if (autoDeductionRules) department.autoDeductionRules = autoDeductionRules;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message,
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Super Admin, Sub Admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if department has employees
    const employeeCount = await User.countDocuments({ department: req.params.id });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${employeeCount} employee(s) assigned. Please reassign employees first.`,
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message,
    });
  }
};

// @desc    Assign HOD to department
// @route   PUT /api/departments/:id/assign-hod
// @access  Private (Super Admin, Sub Admin, HR)
exports.assignHOD = async (req, res) => {
  try {
    const { hodId } = req.body;

    if (!hodId) {
      return res.status(400).json({
        success: false,
        message: 'HOD ID is required',
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const hodUser = await User.findById(hodId);
    if (!hodUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    department.hod = hodId;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'HOD assigned successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error assigning HOD:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning HOD',
      error: error.message,
    });
  }
};

// @desc    Assign HR to department
// @route   PUT /api/departments/:id/assign-hr
// @access  Private (Super Admin, Sub Admin)
exports.assignHR = async (req, res) => {
  try {
    const { hrId } = req.body;

    if (!hrId) {
      return res.status(400).json({
        success: false,
        message: 'HR ID is required',
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const hrUser = await User.findById(hrId);
    if (!hrUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    department.hr = hrId;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'HR assigned successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error assigning HR:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning HR',
      error: error.message,
    });
  }
};


