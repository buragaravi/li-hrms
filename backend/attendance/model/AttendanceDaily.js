/**
 * Attendance Daily Model
 * Aggregated daily view - one document per employee per date
 */

const mongoose = require('mongoose');

const attendanceDailySchema = new mongoose.Schema(
  {
    employeeNumber: {
      type: String,
      required: [true, 'Employee number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Date is required'],
      index: true,
    },
    inTime: {
      type: Date,
      default: null,
    },
    outTime: {
      type: Date,
      default: null,
    },
    totalHours: {
      type: Number,
      default: null, // Calculated: (outTime - inTime) / (1000 * 60 * 60)
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'PARTIAL'],
      default: 'ABSENT',
    },
    source: {
      type: [String],
      enum: ['mssql', 'excel', 'manual'],
      default: [],
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    locked: {
      type: Boolean,
      default: false, // For manual overrides
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: one record per employee per date
attendanceDailySchema.index({ employeeNumber: 1, date: 1 }, { unique: true });

// Index for calendar queries
attendanceDailySchema.index({ date: 1 });

// Index for employee queries
attendanceDailySchema.index({ employeeNumber: 1, date: -1 });

// Method to calculate total hours
attendanceDailySchema.methods.calculateTotalHours = function() {
  if (this.inTime && this.outTime) {
    const diffMs = this.outTime.getTime() - this.inTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    this.totalHours = Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    return this.totalHours;
  }
  return null;
};

// Pre-save hook to calculate total hours
attendanceDailySchema.pre('save', function(next) {
  if (this.inTime && this.outTime) {
    this.calculateTotalHours();
  }
  next();
});

module.exports = mongoose.model('AttendanceDaily', attendanceDailySchema);

