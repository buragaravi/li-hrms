const mongoose = require('mongoose');

/**
 * Department Settings Model
 * Stores department-specific settings that override global defaults
 * Used for Leaves, Loans, Salary Advances, and Permissions
 */
const departmentSettingsSchema = new mongoose.Schema(
  {
    // Department reference
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      unique: true,
    },

    // Leaves Settings
    leaves: {
      // Leave accrual rate per day (e.g., 1.5, 2.0, 2.5)
      leavesPerDay: {
        type: Number,
        default: null, // null = use global default
        min: 0,
      },
      // Total paid leaves count
      paidLeavesCount: {
        type: Number,
        default: null, // null = use global default
        min: 0,
      },
      // Daily leave limit (0 = unlimited)
      dailyLimit: {
        type: Number,
        default: null,
        min: 0,
      },
      // Monthly leave limit (0 = unlimited)
      monthlyLimit: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    // Loans Settings
    loans: {
      // Interest rate (percentage)
      interestRate: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // Is interest applicable
      isInterestApplicable: {
        type: Boolean,
        default: null,
      },
      // Minimum tenure in months
      minTenure: {
        type: Number,
        default: null,
        min: 1,
      },
      // Maximum tenure in months
      maxTenure: {
        type: Number,
        default: null,
        min: 1,
      },
      // Minimum loan amount
      minAmount: {
        type: Number,
        default: null,
        min: 0,
      },
      // Maximum loan amount (null = unlimited)
      maxAmount: {
        type: Number,
        default: null,
        min: 0,
      },
      // Maximum loan per employee (lifetime, null = unlimited)
      maxPerEmployee: {
        type: Number,
        default: null,
        min: 0,
      },
      // Maximum active loans per employee
      maxActivePerEmployee: {
        type: Number,
        default: null,
        min: 1,
      },
      // Minimum service period (in months) to be eligible
      minServicePeriod: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    // Salary Advance Settings
    salaryAdvance: {
      // Interest rate (percentage)
      interestRate: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // Is interest applicable
      isInterestApplicable: {
        type: Boolean,
        default: null,
      },
      // Minimum tenure in months
      minTenure: {
        type: Number,
        default: null,
        min: 1,
      },
      // Maximum tenure in months
      maxTenure: {
        type: Number,
        default: null,
        min: 1,
      },
      // Minimum advance amount
      minAmount: {
        type: Number,
        default: null,
        min: 0,
      },
      // Maximum advance amount (null = unlimited)
      maxAmount: {
        type: Number,
        default: null,
        min: 0,
      },
      // Maximum advance per employee (lifetime, null = unlimited)
      maxPerEmployee: {
        type: Number,
        default: null,
        min: 0,
      },
      // Maximum active advances per employee
      maxActivePerEmployee: {
        type: Number,
        default: null,
        min: 1,
      },
      // Minimum service period (in months) to be eligible
      minServicePeriod: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    // Permissions Settings
    permissions: {
      // Permissions per day limit (0 = unlimited)
      perDayLimit: {
        type: Number,
        default: null,
        min: 0,
      },
      // Monthly permission limit (0 = unlimited)
      monthlyLimit: {
        type: Number,
        default: null,
        min: 0,
      },
      // Whether to deduct from salary
      deductFromSalary: {
        type: Boolean,
        default: null,
      },
      // Amount to deduct per permission
      deductionAmount: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
departmentSettingsSchema.index({ department: 1 }, { unique: true });

// Static method to get settings for a department
departmentSettingsSchema.statics.getByDepartment = async function (departmentId) {
  return this.findOne({ department: departmentId });
};

// Static method to get or create settings for a department
departmentSettingsSchema.statics.getOrCreate = async function (departmentId) {
  let settings = await this.findOne({ department: departmentId });
  if (!settings) {
    settings = new this({ department: departmentId });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('DepartmentSettings', departmentSettingsSchema);

