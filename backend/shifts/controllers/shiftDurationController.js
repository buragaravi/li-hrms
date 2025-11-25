const ShiftDuration = require('../model/ShiftDuration');

// @desc    Get all shift durations
// @route   GET /api/shifts/durations
// @access  Private
exports.getAllShiftDurations = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const durations = await ShiftDuration.find(query)
      .sort({ duration: 1 });

    res.status(200).json({
      success: true,
      count: durations.length,
      data: durations.map((d) => d.duration),
      durations: durations, // Full objects with labels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shift durations',
      error: error.message,
    });
  }
};

// @desc    Create shift duration
// @route   POST /api/shifts/durations
// @access  Private (Super Admin, Sub Admin)
exports.createShiftDuration = async (req, res) => {
  try {
    const { duration, label } = req.body;

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required and must be positive',
      });
    }

    const shiftDuration = await ShiftDuration.create({
      duration: Number(duration),
      label: label || `${duration} hours`,
    });

    res.status(201).json({
      success: true,
      message: 'Shift duration created successfully',
      data: shiftDuration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duration already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating shift duration',
      error: error.message,
    });
  }
};

// @desc    Update shift duration
// @route   PUT /api/shifts/durations/:id
// @access  Private (Super Admin, Sub Admin)
exports.updateShiftDuration = async (req, res) => {
  try {
    const { duration, label, isActive } = req.body;

    const shiftDuration = await ShiftDuration.findById(req.params.id);
    if (!shiftDuration) {
      return res.status(404).json({
        success: false,
        message: 'Shift duration not found',
      });
    }

    if (duration !== undefined) shiftDuration.duration = Number(duration);
    if (label !== undefined) shiftDuration.label = label;
    if (isActive !== undefined) shiftDuration.isActive = isActive;

    await shiftDuration.save();

    res.status(200).json({
      success: true,
      message: 'Shift duration updated successfully',
      data: shiftDuration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duration already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating shift duration',
      error: error.message,
    });
  }
};

// @desc    Delete shift duration
// @route   DELETE /api/shifts/durations/:id
// @access  Private (Super Admin, Sub Admin)
exports.deleteShiftDuration = async (req, res) => {
  try {
    const shiftDuration = await ShiftDuration.findById(req.params.id);
    if (!shiftDuration) {
      return res.status(404).json({
        success: false,
        message: 'Shift duration not found',
      });
    }

    await shiftDuration.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Shift duration deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting shift duration',
      error: error.message,
    });
  }
};

