/**
 * Attendance Controller
 * Handles attendance data retrieval and display
 */

const AttendanceDaily = require('../model/AttendanceDaily');
const AttendanceRawLog = require('../model/AttendanceRawLog');
const Employee = require('../../employees/model/Employee');
const Shift = require('../../shifts/model/Shift');
const Leave = require('../../leaves/model/Leave');
const OD = require('../../leaves/model/OD');
const MonthlyAttendanceSummary = require('../model/MonthlyAttendanceSummary');
const { calculateMonthlySummary } = require('../services/summaryCalculationService');

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

    // Get employee to fetch leaves and ODs
    const employee = await Employee.findOne({ emp_no: employeeNumber.toUpperCase(), is_active: { $ne: false } });
    
    // Fetch attendance records for the month
    const records = await AttendanceDaily.find({
      employeeNumber: employeeNumber.toUpperCase(),
      date: { $gte: startDate, $lte: endDateStr },
    })
      .populate('shiftId', 'name startTime endTime duration payableShifts')
      .sort({ date: 1 });

    // Fetch approved leaves for this month
    const startDateObj = new Date(targetYear, targetMonth - 1, 1);
    const endDateObj = new Date(targetYear, targetMonth, 0);
    const approvedLeaves = employee ? await Leave.find({
      employeeId: employee._id,
      status: 'approved',
      $or: [
        { fromDate: { $lte: endDateObj }, toDate: { $gte: startDateObj } },
      ],
      isActive: true,
    }) : [];

    // Fetch approved ODs for this month
    const approvedODs = employee ? await OD.find({
      employeeId: employee._id,
      status: 'approved',
      $or: [
        { fromDate: { $lte: endDateObj }, toDate: { $gte: startDateObj } },
      ],
      isActive: true,
    }) : [];

    // Create maps for leaves and ODs by date
    const leaveMap = {};
    approvedLeaves.forEach(leave => {
      const leaveStart = new Date(leave.fromDate);
      const leaveEnd = new Date(leave.toDate);
      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(23, 59, 59, 999);
      
      let currentDate = new Date(leaveStart);
      while (currentDate <= leaveEnd) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        if (dateStr >= startDate && dateStr <= endDateStr) {
          leaveMap[dateStr] = {
            leaveId: leave._id,
            leaveType: leave.leaveType,
            isHalfDay: leave.isHalfDay,
            halfDayType: leave.halfDayType,
          };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const odMap = {};
    approvedODs.forEach(od => {
      const odStart = new Date(od.fromDate);
      const odEnd = new Date(od.toDate);
      odStart.setHours(0, 0, 0, 0);
      odEnd.setHours(23, 59, 59, 999);
      
      let currentDate = new Date(odStart);
      while (currentDate <= odEnd) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        if (dateStr >= startDate && dateStr <= endDateStr) {
          odMap[dateStr] = {
            odId: od._id,
            odType: od.odType,
            isHalfDay: od.isHalfDay,
            halfDayType: od.halfDayType,
          };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Create a map for quick lookup
    const attendanceMap = {};
    records.forEach(record => {
      const hasLeave = !!leaveMap[record.date];
      const hasOD = !!odMap[record.date];
      const hasAttendance = record.status === 'PRESENT' || record.status === 'PARTIAL';
      const isConflict = (hasLeave || hasOD) && hasAttendance;
      
      attendanceMap[record.date] = {
        date: record.date,
        inTime: record.inTime,
        outTime: record.outTime,
        totalHours: record.totalHours,
        status: record.status,
        shiftId: record.shiftId,
        isLateIn: record.isLateIn || false,
        isEarlyOut: record.isEarlyOut || false,
        lateInMinutes: record.lateInMinutes || null,
        earlyOutMinutes: record.earlyOutMinutes || null,
        expectedHours: record.expectedHours || null,
        hasLeave: hasLeave,
        leaveInfo: leaveMap[record.date] || null,
        hasOD: hasOD,
        odInfo: odMap[record.date] || null,
        isConflict: isConflict,
      };
    });

    // Also add leave/OD info for dates without attendance records
    Object.keys(leaveMap).forEach(dateStr => {
      if (!attendanceMap[dateStr]) {
        attendanceMap[dateStr] = {
          date: dateStr,
          status: 'LEAVE',
          hasLeave: true,
          leaveInfo: leaveMap[dateStr],
          hasOD: !!odMap[dateStr],
          odInfo: odMap[dateStr] || null,
          isConflict: false,
        };
      }
    });

    Object.keys(odMap).forEach(dateStr => {
      if (!attendanceMap[dateStr]) {
        attendanceMap[dateStr] = {
          date: dateStr,
          status: 'OD',
          hasLeave: !!leaveMap[dateStr],
          leaveInfo: leaveMap[dateStr] || null,
          hasOD: true,
          odInfo: odMap[dateStr],
          isConflict: false,
        };
      }
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
      date: { $gte: startDate, $lte: endDateStr },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await AttendanceDaily.find(query)
      .populate('shiftId', 'name startTime endTime duration')
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
    })
      .populate('shiftId', 'name startTime endTime duration gracePeriod');

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

/**
 * @desc    Get all employees attendance for a month (for table view)
 * @route   GET /api/attendance/monthly
 * @access  Private
 */
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
      });
    }

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    const daysInMonth = endDate.getDate();

    // Get all active employees
    const employees = await Employee.find({ is_active: { $ne: false } })
      .populate('department_id', 'name')
      .populate('designation_id', 'name')
      .sort({ employee_name: 1 });

    // Get all attendance records for the month
    const attendanceRecords = await AttendanceDaily.find({
      date: { $gte: startDate, $lte: endDateStr },
    })
      .populate('shiftId', 'name startTime endTime duration payableShifts')
      .sort({ employeeNumber: 1, date: 1 });

    // Get all approved leaves for this month
    const startDateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDateObj = new Date(parseInt(year), parseInt(month), 0);
    const allLeaves = await Leave.find({
      status: 'approved',
      $or: [
        { fromDate: { $lte: endDateObj }, toDate: { $gte: startDateObj } },
      ],
      isActive: true,
    }).populate('employeeId', 'emp_no');

    // Get all approved ODs for this month
    const allODs = await OD.find({
      status: 'approved',
      $or: [
        { fromDate: { $lte: endDateObj }, toDate: { $gte: startDateObj } },
      ],
      isActive: true,
    }).populate('employeeId', 'emp_no');

    // Create leave and OD maps by employee and date
    const leaveMapByEmployee = {};
    allLeaves.forEach(leave => {
      const empNo = leave.employeeId?.emp_no || leave.emp_no;
      if (!empNo) return;
      if (!leaveMapByEmployee[empNo]) {
        leaveMapByEmployee[empNo] = {};
      }
      const leaveStart = new Date(leave.fromDate);
      const leaveEnd = new Date(leave.toDate);
      // Reset time to avoid timezone issues
      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(23, 59, 59, 999);
      
      // Iterate through all dates in the leave range
      let currentDate = new Date(leaveStart);
      while (currentDate <= leaveEnd) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        if (dateStr >= startDate && dateStr <= endDateStr) {
          leaveMapByEmployee[empNo][dateStr] = {
            leaveId: leave._id,
            leaveType: leave.leaveType,
            isHalfDay: leave.isHalfDay,
            halfDayType: leave.halfDayType,
          };
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const odMapByEmployee = {};
    allODs.forEach(od => {
      const empNo = od.employeeId?.emp_no || od.emp_no;
      if (!empNo) return;
      if (!odMapByEmployee[empNo]) {
        odMapByEmployee[empNo] = {};
      }
      const odStart = new Date(od.fromDate);
      const odEnd = new Date(od.toDate);
      // Reset time to avoid timezone issues
      odStart.setHours(0, 0, 0, 0);
      odEnd.setHours(23, 59, 59, 999);
      
      // Iterate through all dates in the OD range
      let currentDate = new Date(odStart);
      while (currentDate <= odEnd) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        if (dateStr >= startDate && dateStr <= endDateStr) {
          odMapByEmployee[empNo][dateStr] = {
            odId: od._id,
            odType: od.odType,
            isHalfDay: od.isHalfDay,
            halfDayType: od.halfDayType,
          };
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Create a map: employeeNumber -> date -> record
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      if (!attendanceMap[record.employeeNumber]) {
        attendanceMap[record.employeeNumber] = {};
      }
      attendanceMap[record.employeeNumber][record.date] = record;
    });

    // Get or calculate monthly summaries for payable shifts
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    // Calculate summaries for all employees (this ensures they're always up to date)
    const summaryMap = {};
    
    // Calculate summaries for all employees in parallel
    const summaryPromises = employees.map(async (emp) => {
      try {
        const summary = await calculateMonthlySummary(emp._id, emp.emp_no, parseInt(year), parseInt(month));
        return { emp_no: emp.emp_no, payableShifts: summary.totalPayableShifts };
      } catch (error) {
        console.error(`Error calculating summary for ${emp.emp_no}:`, error);
        return { emp_no: emp.emp_no, payableShifts: 0 };
      }
    });
    
    const summaryResults = await Promise.all(summaryPromises);
    summaryResults.forEach(result => {
      summaryMap[result.emp_no] = result.payableShifts;
    });

    // Build response with employees and their daily attendance
    const employeesWithAttendance = employees.map(emp => {
      const dailyAttendance = {};
      
      // Create entries for all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = attendanceMap[emp.emp_no]?.[dateStr] || null;
        const leaveInfo = leaveMapByEmployee[emp.emp_no]?.[dateStr] || null;
        const odInfo = odMapByEmployee[emp.emp_no]?.[dateStr] || null;
        const hasLeave = !!leaveInfo;
        const hasOD = !!odInfo;
        const hasAttendance = !!record && (record.status === 'PRESENT' || record.status === 'PARTIAL');
        const isConflict = (hasLeave || hasOD) && hasAttendance;
        
        dailyAttendance[dateStr] = record ? {
          date: record.date,
          status: record.status,
          inTime: record.inTime,
          outTime: record.outTime,
          totalHours: record.totalHours,
          shiftId: record.shiftId,
          isLateIn: record.isLateIn,
          isEarlyOut: record.isEarlyOut,
          lateInMinutes: record.lateInMinutes,
          earlyOutMinutes: record.earlyOutMinutes,
          hasLeave: hasLeave,
          leaveInfo: leaveInfo,
          hasOD: hasOD,
          odInfo: odInfo,
          isConflict: isConflict,
        } : {
          date: dateStr,
          status: hasLeave || hasOD ? (hasLeave ? 'LEAVE' : 'OD') : 'ABSENT',
          hasLeave: hasLeave,
          leaveInfo: leaveInfo,
          hasOD: hasOD,
          odInfo: odInfo,
          isConflict: false,
        };
      }

      // Calculate present days
      let presentDays = 0;
      Object.values(dailyAttendance).forEach(day => {
        if (day && (day.status === 'PRESENT' || day.status === 'PARTIAL')) {
          presentDays++;
        }
      });

      return {
        employee: {
          _id: emp._id,
          emp_no: emp.emp_no,
          employee_name: emp.employee_name,
          department: emp.department_id,
          designation: emp.designation_id,
        },
        dailyAttendance,
        presentDays,
        payableShifts: summaryMap[emp.emp_no] || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: employeesWithAttendance,
      month: parseInt(month),
      year: parseInt(year),
      daysInMonth,
    });

  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly attendance',
    });
  }
};
