/**
 * Attendance Sync Service
 * Handles syncing attendance logs from MSSQL to MongoDB
 * Processes raw logs and aggregates into daily records
 */

const AttendanceRawLog = require('../model/AttendanceRawLog');
const AttendanceDaily = require('../model/AttendanceDaily');
const AttendanceSettings = require('../model/AttendanceSettings');
const { fetchAttendanceLogsFromMSSQL } = require('../config/attendanceMSSQLHelper');

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Process raw logs and aggregate into daily records
 * @param {Array} rawLogs - Array of raw log objects
 * @param {Boolean} previousDayLinking - Whether to enable previous day linking
 * @returns {Object} Statistics of processed records
 */
const processAndAggregateLogs = async (rawLogs, previousDayLinking = false) => {
  const stats = {
    rawLogsInserted: 0,
    rawLogsSkipped: 0,
    dailyRecordsCreated: 0,
    dailyRecordsUpdated: 0,
    errors: [],
  };

  try {
    // Group logs by employee and date
    const logsByEmployeeAndDate = {};

    // First, insert all raw logs (with duplicate prevention)
    for (const log of rawLogs) {
      try {
        const date = formatDate(log.timestamp);
        const logData = {
          employeeNumber: log.employeeNumber,
          timestamp: new Date(log.timestamp),
          type: log.type,
          source: 'mssql',
          date: date,
          rawData: log.rawData,
        };

        // Try to insert (will fail if duplicate due to unique index)
        try {
          await AttendanceRawLog.create(logData);
          stats.rawLogsInserted++;
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate - skip
            stats.rawLogsSkipped++;
          } else {
            throw error;
          }
        }

        // Group for aggregation
        const key = `${log.employeeNumber}_${date}`;
        if (!logsByEmployeeAndDate[key]) {
          logsByEmployeeAndDate[key] = [];
        }
        logsByEmployeeAndDate[key].push({
          timestamp: new Date(log.timestamp),
          type: log.type,
        });

      } catch (error) {
        stats.errors.push(`Error processing log for ${log.employeeNumber}: ${error.message}`);
      }
    }

    // Handle previous day linking if enabled
    if (previousDayLinking) {
      await applyPreviousDayLinking(logsByEmployeeAndDate);
    }

    // Aggregate into daily records
    for (const [key, logs] of Object.entries(logsByEmployeeAndDate)) {
      try {
        const [employeeNumber, date] = key.split('_');
        
        // Sort logs by timestamp
        logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Deduce IN/OUT times
        let inTime = null;
        let outTime = null;
        let status = 'ABSENT';

        if (logs.length === 0) {
          status = 'ABSENT';
        } else if (logs.length === 1) {
          // Only one log - check if type is specified
          if (logs[0].type === 'IN') {
            inTime = logs[0].timestamp;
            status = 'PARTIAL';
          } else if (logs[0].type === 'OUT') {
            outTime = logs[0].timestamp;
            status = 'PARTIAL';
          } else {
            // No type - assume it's IN
            inTime = logs[0].timestamp;
            status = 'PARTIAL';
          }
        } else {
          // Multiple logs - first is IN, last is OUT
          // If types are specified, use them; otherwise use position
          const inLog = logs.find(l => l.type === 'IN') || logs[0];
          const outLog = logs.find(l => l.type === 'OUT') || logs[logs.length - 1];
          
          inTime = inLog.timestamp;
          outTime = outLog.timestamp;
          status = 'PRESENT';
        }

        // Calculate total hours
        let totalHours = null;
        if (inTime && outTime) {
          const diffMs = outTime.getTime() - inTime.getTime();
          totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        }

        // Update or create daily record
        const dailyRecord = await AttendanceDaily.findOneAndUpdate(
          { employeeNumber, date },
          {
            $set: {
              inTime,
              outTime,
              totalHours,
              status,
              lastSyncedAt: new Date(),
            },
            $addToSet: { source: 'mssql' }, // Add source if not present
          },
          { upsert: true, new: true }
        );

        if (dailyRecord.isNew) {
          stats.dailyRecordsCreated++;
        } else {
          stats.dailyRecordsUpdated++;
        }

      } catch (error) {
        stats.errors.push(`Error aggregating daily record for ${key}: ${error.message}`);
      }
    }

  } catch (error) {
    stats.errors.push(`Error in processAndAggregateLogs: ${error.message}`);
  }

  return stats;
};

/**
 * Apply previous day linking heuristic
 * If previous day has 1 log and current day has 1 log, link them
 */
const applyPreviousDayLinking = async (logsByEmployeeAndDate) => {
  // This is a simplified version - can be enhanced
  // For now, we'll mark these for admin review if needed
  // The actual linking logic can be more complex based on shift times
  // TODO: Implement full previous day linking logic
};

/**
 * Sync attendance from MSSQL to MongoDB
 * @param {Date} fromDate - Start date (optional, defaults to last 7 days)
 * @param {Date} toDate - End date (optional, defaults to today)
 * @returns {Object} Sync statistics
 */
const syncAttendanceFromMSSQL = async (fromDate = null, toDate = null) => {
  const stats = {
    success: false,
    rawLogsFetched: 0,
    rawLogsInserted: 0,
    rawLogsSkipped: 0,
    dailyRecordsCreated: 0,
    dailyRecordsUpdated: 0,
    errors: [],
    message: '',
  };

  try {
    // Get settings
    const settings = await AttendanceSettings.getSettings();

    if (settings.dataSource !== 'mssql') {
      throw new Error('Data source is not set to MSSQL');
    }

    if (!settings.mssqlConfig.databaseName || !settings.mssqlConfig.tableName) {
      throw new Error('MSSQL configuration is incomplete');
    }

    // Set default date range if not provided
    if (!fromDate) {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7); // Last 7 days
    }
    if (!toDate) {
      toDate = new Date();
    }

    // Fetch logs from MSSQL
    const rawLogs = await fetchAttendanceLogsFromMSSQL(settings, fromDate, toDate);
    stats.rawLogsFetched = rawLogs.length;

    if (rawLogs.length === 0) {
      stats.message = 'No logs found in MSSQL for the specified date range';
      stats.success = true;
      return stats;
    }

    // Process and aggregate
    const processStats = await processAndAggregateLogs(
      rawLogs,
      settings.previousDayLinking?.enabled || false
    );

    stats.rawLogsInserted = processStats.rawLogsInserted;
    stats.rawLogsSkipped = processStats.rawLogsSkipped;
    stats.dailyRecordsCreated = processStats.dailyRecordsCreated;
    stats.dailyRecordsUpdated = processStats.dailyRecordsUpdated;
    stats.errors = processStats.errors;

    // Update sync status in settings
    await AttendanceSettings.findOneAndUpdate(
      {},
      {
        $set: {
          'syncSettings.lastSyncAt': new Date(),
          'syncSettings.lastSyncStatus': stats.errors.length > 0 ? 'failed' : 'success',
          'syncSettings.lastSyncMessage': stats.errors.length > 0 
            ? `Sync completed with ${stats.errors.length} errors`
            : `Successfully synced ${stats.rawLogsInserted} logs`,
        },
      }
    );

    stats.success = true;
    stats.message = `Successfully synced ${stats.rawLogsInserted} logs, created ${stats.dailyRecordsCreated} daily records, updated ${stats.dailyRecordsUpdated} records`;

  } catch (error) {
    stats.success = false;
    stats.errors.push(error.message);
    stats.message = `Sync failed: ${error.message}`;

    // Update sync status
    try {
      await AttendanceSettings.findOneAndUpdate(
        {},
        {
          $set: {
            'syncSettings.lastSyncAt': new Date(),
            'syncSettings.lastSyncStatus': 'failed',
            'syncSettings.lastSyncMessage': error.message,
          },
        }
      );
    } catch (updateError) {
      // Ignore update error
    }
  }

  return stats;
};

module.exports = {
  syncAttendanceFromMSSQL,
  processAndAggregateLogs,
  formatDate,
};

