/**
 * Attendance Sync Controller
 * Handles manual and automatic syncing from MSSQL
 */

const { syncAttendanceFromMSSQL } = require('../services/attendanceSyncService');
const AttendanceSettings = require('../model/AttendanceSettings');

/**
 * @desc    Manual sync from MSSQL
 * @route   POST /api/attendance/sync
 * @access  Private (Super Admin, Sub Admin)
 */
exports.manualSync = async (req, res) => {
  try {
    // Only Super Admin and Sub Admin can sync
    if (!['super_admin', 'sub_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to sync attendance',
      });
    }

    const { fromDate, toDate } = req.body;

    let from = null;
    let to = null;

    if (fromDate) {
      from = new Date(fromDate);
    }
    if (toDate) {
      to = new Date(toDate);
    }

    const stats = await syncAttendanceFromMSSQL(from, to);

    res.status(200).json({
      success: stats.success,
      message: stats.message,
      data: stats,
    });

  } catch (error) {
    console.error('Error in manual sync:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync attendance',
    });
  }
};

/**
 * @desc    Get sync status
 * @route   GET /api/attendance/sync/status
 * @access  Private
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const settings = await AttendanceSettings.getSettings();

    res.status(200).json({
      success: true,
      data: {
        lastSyncAt: settings.syncSettings.lastSyncAt,
        lastSyncStatus: settings.syncSettings.lastSyncStatus,
        lastSyncMessage: settings.syncSettings.lastSyncMessage,
        autoSyncEnabled: settings.syncSettings.autoSyncEnabled,
        syncIntervalHours: settings.syncSettings.syncIntervalHours,
      },
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sync status',
    });
  }
};

