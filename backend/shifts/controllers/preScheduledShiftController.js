/**
 * Pre-Scheduled Shift Controller
 * Handles pre-scheduled shift assignments for employees
 */

const PreScheduledShift = require('../model/PreScheduledShift');
const Shift = require('../model/Shift');
const Employee = require('../../employees/model/Employee');

/**
 * @desc    Create pre-scheduled shift
 * @route   POST /api/shifts/pre-schedule
 * @access  Private (Super Admin, Sub Admin, HR, HOD)
 */
exports.createPreScheduledShift = async (req, res) => {
  try {
    const { employeeNumber, shiftId, date, notes } = req.body;

    if (!employeeNumber || !shiftId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee number, shift ID, and date are required',
      });
    }

    // Validate employee exists
    const employee = await Employee.findOne({ emp_no: employeeNumber.toUpperCase() });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Validate shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    // Check if already scheduled
    const existing = await PreScheduledShift.findOne({
      employeeNumber: employeeNumber.toUpperCase(),
      date: date,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Shift already scheduled for this employee on this date',
      });
    }

    const preScheduled = await PreScheduledShift.create({
      employeeNumber: employeeNumber.toUpperCase(),
      shiftId,
      date,
      scheduledBy: req.user._id,
      notes: notes || null,
    });

    await preScheduled.populate([
      { path: 'shiftId', select: 'name startTime endTime duration' },
      { path: 'scheduledBy', select: 'name email' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Pre-scheduled shift created successfully',
      data: preScheduled,
    });

  } catch (error) {
    console.error('Error creating pre-scheduled shift:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Shift already scheduled for this employee on this date',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create pre-scheduled shift',
    });
  }
};

/**
 * @desc    Get pre-scheduled shifts
 * @route   GET /api/shifts/pre-schedule
 * @access  Private
 */
exports.getPreScheduledShifts = async (req, res) => {
  try {
    const { employeeNumber, startDate, endDate, shiftId, page = 1, limit = 50 } = req.query;

    const query = {};

    if (employeeNumber) {
      query.employeeNumber = employeeNumber.toUpperCase();
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (shiftId) {
      query.shiftId = shiftId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const preScheduledShifts = await PreScheduledShift.find(query)
      .populate('shiftId', 'name startTime endTime duration')
      .populate('scheduledBy', 'name email')
      .sort({ date: 1, employeeNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PreScheduledShift.countDocuments(query);

    res.status(200).json({
      success: true,
      data: preScheduledShifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error('Error fetching pre-scheduled shifts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pre-scheduled shifts',
    });
  }
};

/**
 * @desc    Bulk create pre-scheduled shifts
 * @route   POST /api/shifts/pre-schedule/bulk
 * @access  Private (Super Admin, Sub Admin, HR, HOD)
 */
exports.bulkCreatePreScheduledShifts = async (req, res) => {
  try {
    const { schedules } = req.body; // Array of { employeeNumber, shiftId, date, notes? }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedules array is required',
      });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const schedule of schedules) {
      try {
        const { employeeNumber, shiftId, date, notes } = schedule;

        if (!employeeNumber || !shiftId || !date) {
          results.errors.push(`Missing required fields: ${JSON.stringify(schedule)}`);
          results.skipped++;
          continue;
        }

        // Check if already exists
        const existing = await PreScheduledShift.findOne({
          employeeNumber: employeeNumber.toUpperCase(),
          date: date,
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await PreScheduledShift.create({
          employeeNumber: employeeNumber.toUpperCase(),
          shiftId,
          date,
          scheduledBy: req.user._id,
          notes: notes || null,
        });

        results.created++;

      } catch (error) {
        results.errors.push(`Error creating schedule: ${error.message}`);
        results.skipped++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${results.created} pre-scheduled shifts`,
      data: results,
    });

  } catch (error) {
    console.error('Error in bulk create:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create pre-scheduled shifts',
    });
  }
};

/**
 * @desc    Update pre-scheduled shift
 * @route   PUT /api/shifts/pre-schedule/:id
 * @access  Private (Super Admin, Sub Admin, HR, HOD)
 */
exports.updatePreScheduledShift = async (req, res) => {
  try {
    const { shiftId, notes } = req.body;

    const preScheduled = await PreScheduledShift.findById(req.params.id);

    if (!preScheduled) {
      return res.status(404).json({
        success: false,
        message: 'Pre-scheduled shift not found',
      });
    }

    if (shiftId) {
      const shift = await Shift.findById(shiftId);
      if (!shift) {
        return res.status(404).json({
          success: false,
          message: 'Shift not found',
        });
      }
      preScheduled.shiftId = shiftId;
    }

    if (notes !== undefined) {
      preScheduled.notes = notes;
    }

    await preScheduled.save();

    await preScheduled.populate([
      { path: 'shiftId', select: 'name startTime endTime duration' },
      { path: 'scheduledBy', select: 'name email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Pre-scheduled shift updated successfully',
      data: preScheduled,
    });

  } catch (error) {
    console.error('Error updating pre-scheduled shift:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update pre-scheduled shift',
    });
  }
};

/**
 * @desc    Delete pre-scheduled shift
 * @route   DELETE /api/shifts/pre-schedule/:id
 * @access  Private (Super Admin, Sub Admin, HR, HOD)
 */
exports.deletePreScheduledShift = async (req, res) => {
  try {
    const preScheduled = await PreScheduledShift.findById(req.params.id);

    if (!preScheduled) {
      return res.status(404).json({
        success: false,
        message: 'Pre-scheduled shift not found',
      });
    }

    await preScheduled.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Pre-scheduled shift deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting pre-scheduled shift:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete pre-scheduled shift',
    });
  }
};

