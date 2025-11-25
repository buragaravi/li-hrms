const Shift = require('../model/Shift');
const ShiftDuration = require('../model/ShiftDuration');
const mongoose = require('mongoose');

// @desc    Get all shifts
// @route   GET /api/shifts
// @access  Private
exports.getAllShifts = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const shifts = await Shift.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shifts',
      error: error.message,
    });
  }
};

// @desc    Get single shift
// @route   GET /api/shifts/:id
// @access  Private
exports.getShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id).populate('createdBy', 'name email');

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shift',
      error: error.message,
    });
  }
};

// @desc    Create new shift
// @route   POST /api/shifts
// @access  Private (Super Admin, Sub Admin, HR)
exports.createShift = async (req, res) => {
  try {
    const { name, startTime, endTime, duration } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Shift name is required',
      });
    }

    // Get allowed durations from ShiftDuration model
    let allowedDurations = [];
    try {
      const durationDocs = await ShiftDuration.find({ isActive: true }).select('duration');
      allowedDurations = durationDocs.map((d) => d.duration);
    } catch (err) {
      console.warn('ShiftDuration model not available, skipping validation:', err.message);
      // If ShiftDuration doesn't exist yet, allow all durations
    }

    let finalDuration = duration;
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    // If duration is provided, calculate end time from start time
    if (duration && startTime && !endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + duration * 60;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      finalEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    }
    // If start and end are provided, calculate duration
    else if (startTime && endTime && !duration) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // Handle overnight shifts
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
      }

      const durationMinutes = endMinutes - startMinutes;
      finalDuration = Math.round((durationMinutes / 60) * 100) / 100;
    }

    // Validate duration against allowed durations
    if (allowedDurations.length > 0) {
      const isAllowed = allowedDurations.some(
        (allowed) => Math.abs(allowed - finalDuration) < 0.01
      );

      if (!isAllowed) {
        return res.status(400).json({
          success: false,
          message: `Duration ${finalDuration} hours is not allowed. Allowed durations: ${allowedDurations.join(', ')} hours`,
          allowedDurations,
        });
      }
    }

    // Validate that we have all required fields
    if (!finalStartTime || !finalEndTime || !finalDuration) {
      return res.status(400).json({
        success: false,
        message: 'Either provide (name, startTime, endTime) or (name, startTime, duration)',
      });
    }

    // Create shift
    const shift = await Shift.create({
      name,
      startTime: finalStartTime,
      endTime: finalEndTime,
      duration: finalDuration,
      createdBy: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Shift with this name already exists',
      });
    }

    console.error('Error creating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating shift',
      error: error.message,
    });
  }
};

// @desc    Update shift
// @route   PUT /api/shifts/:id
// @access  Private (Super Admin, Sub Admin, HR)
exports.updateShift = async (req, res) => {
  try {
    const { name, startTime, endTime, duration, isActive } = req.body;

    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    // Get allowed durations from ShiftDuration model
    let allowedDurations = [];
    try {
      const durationDocs = await ShiftDuration.find({ isActive: true }).select('duration');
      allowedDurations = durationDocs.map((d) => d.duration);
    } catch (err) {
      console.warn('ShiftDuration model not available, skipping validation:', err.message);
    }

    // Update fields
    if (name) shift.name = name;
    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (isActive !== undefined) shift.isActive = isActive;

    // Recalculate duration if times changed
    if (startTime || endTime) {
      const finalStartTime = startTime || shift.startTime;
      const finalEndTime = endTime || shift.endTime;

      const [startHour, startMin] = finalStartTime.split(':').map(Number);
      const [endHour, endMin] = finalEndTime.split(':').map(Number);

      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
      }

      const durationMinutes = endMinutes - startMinutes;
      shift.duration = Math.round((durationMinutes / 60) * 100) / 100;
    } else if (duration) {
      shift.duration = duration;
    }

    // Validate duration
    if (allowedDurations.length > 0) {
      const isAllowed = allowedDurations.some(
        (allowed) => Math.abs(allowed - shift.duration) < 0.01
      );

      if (!isAllowed) {
        return res.status(400).json({
          success: false,
          message: `Duration ${shift.duration} hours is not allowed. Allowed durations: ${allowedDurations.join(', ')} hours`,
          allowedDurations,
        });
      }
    }

    await shift.save();

    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: shift,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Shift with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating shift',
      error: error.message,
    });
  }
};

// @desc    Delete shift
// @route   DELETE /api/shifts/:id
// @access  Private (Super Admin, Sub Admin)
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    await shift.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting shift',
      error: error.message,
    });
  }
};

// @desc    Get allowed shift durations
// @route   GET /api/shifts/durations
// @access  Private
exports.getAllowedDurations = async (req, res) => {
  try {
    const durationDocs = await ShiftDuration.find({ isActive: true }).sort({ duration: 1 });
    const allowedDurations = durationDocs.map((d) => d.duration);

    res.status(200).json({
      success: true,
      data: allowedDurations,
      durations: durationDocs, // Full objects with labels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching allowed durations',
      error: error.message,
    });
  }
};

