/**
 * Attendance Controller
 * Handles attendance data retrieval and display
 */

const AttendanceDaily = require('../model/AttendanceDaily');
const AttendanceRawLog = require('../model/AttendanceRawLog');
const Employee = require('../../employees/model/Employee');

/**
 * @desc    Get attendance records for calendar view
 * @route   GET /api/attendance/calendar
 * @access  Private
 */
exports.getAttendanceCalendar = async (req, res) => {
  try {
    const { employeeNumber, year, month } = req.query;

    if (!employeeNumber) {
      return res.status(400).json({
        success: false,
        message: 'Employee number is required',
      });
    }

    // Default to current month if not provided
    const currentDate = new Date();
    const targetYear = parseInt(year) || currentDate.getFullYear();
    const targetMonth = parseInt(month) || (currentDate.getMonth() + 1);

    // Calculate date range for the month
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0); // Last day of month
    const endDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    // Fetch attendance records for the month
    const records = await AttendanceDaily.find({
      employeeNumber: employeeNumber.toUpperCase(),
      date: { $gte: startDate, $lte: endDateStr },
    }).sort({ date: 1 });

    // Create a map for quick lookup
    const attendanceMap = {};
    records.forEach(record => {
      attendanceMap[record.date] = {
        date: record.date,
        inTime: record.inTime,
        outTime: record.outTime,
        totalHours: record.totalHours,
        status: record.status,
      };
    });

    res.status(200).json({
      success: true,
      data: attendanceMap,
      year: targetYear,
      month: targetMonth,
    });

  } catch (error) {
    console.error('Error fetching attendance calendar:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance calendar',
    });
  }
};

/**
 * @desc    Get attendance records for list view
 * @route   GET /api/attendance/list
 * @access  Private
 */
exports.getAttendanceList = async (req, res) => {
  try {
    const { employeeNumber, startDate, endDate, page = 1, limit = 30 } = req.query;

    if (!employeeNumber) {
      return res.status(400).json({
        success: false,
        message: 'Employee number is required',
      });
    }

    const query = {
      employeeNumber: employeeNumber.toUpperCase(),
    };

    // Add date range if provided
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await AttendanceDaily.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AttendanceDaily.countDocuments(query);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error('Error fetching attendance list:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance list',
    });
  }
};

/**
 * @desc    Get attendance detail for a specific date
 * @route   GET /api/attendance/detail
 * @access  Private
 */
exports.getAttendanceDetail = async (req, res) => {
  try {
    const { employeeNumber, date } = req.query;

    if (!employeeNumber || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee number and date are required',
      });
    }

    const record = await AttendanceDaily.findOne({
      employeeNumber: employeeNumber.toUpperCase(),
      date: date,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Also fetch raw logs for that day
    const rawLogs = await AttendanceRawLog.find({
      employeeNumber: employeeNumber.toUpperCase(),
      date: date,
    }).sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...record.toObject(),
        rawLogs,
      },
    });

  } catch (error) {
    console.error('Error fetching attendance detail:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance detail',
    });
  }
};

/**
 * @desc    Get all employees with their attendance summary
 * @route   GET /api/attendance/employees
 * @access  Private
 */
exports.getEmployeesWithAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    // Get all employees
    const employees = await Employee.find({ is_active: { $ne: false } })
      .select('emp_no employee_name department_id designation_id')
      .populate('department_id', 'name')
      .populate('designation_id', 'name');

    // If date provided, get attendance for that date
    let attendanceMap = {};
    if (date) {
      const records = await AttendanceDaily.find({ date });
      records.forEach(record => {
        attendanceMap[record.employeeNumber] = record;
      });
    }

    const employeesWithAttendance = employees.map(emp => ({
      ...emp.toObject(),
      attendance: attendanceMap[emp.emp_no] || null,
    }));

    res.status(200).json({
      success: true,
      data: employeesWithAttendance,
    });

  } catch (error) {
    console.error('Error fetching employees with attendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employees with attendance',
    });
  }
};

