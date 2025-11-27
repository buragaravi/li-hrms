const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Setting value is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['shift', 'attendance', 'payroll', 'general', 'employee'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });

module.exports = mongoose.model('Settings', settingsSchema);

