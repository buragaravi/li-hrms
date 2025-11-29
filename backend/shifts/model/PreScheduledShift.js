/**
 * Pre-Scheduled Shift Model
 * Stores pre-assigned shifts for employees (daily or weekly)
 */

const mongoose = require('mongoose');

const preScheduledShiftSchema = new mongoose.Schema(
  {
    employeeNumber: {
      type: String,
      required: [true, 'Employee number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift is required'],
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Date is required'],
      index: true,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Unique index: one pre-scheduled shift per employee per date
preScheduledShiftSchema.index({ employeeNumber: 1, date: 1 }, { unique: true });

// Index for date range queries
preScheduledShiftSchema.index({ date: 1, employeeNumber: 1 });

module.exports = mongoose.model('PreScheduledShift', preScheduledShiftSchema);

