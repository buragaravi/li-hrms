/**
 * Attendance Sync Job
 * Periodic sync job that runs based on configured interval
 */

const AttendanceSettings = require('../model/AttendanceSettings');
const { syncAttendanceFromMSSQL } = require('./attendanceSyncService');

let syncInterval = null;
let isRunning = false;

/**
 * Start the periodic sync job
 */
const startSyncJob = async () => {
  try {
    const settings = await AttendanceSettings.getSettings();

    if (!settings.syncSettings.autoSyncEnabled) {
      console.log('📅 Attendance auto-sync is disabled');
      return;
    }

    const intervalHours = settings.syncSettings.syncIntervalHours || 1;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    console.log(`📅 Starting attendance auto-sync job (interval: ${intervalHours} hours)`);

    // Run initial sync
    await runSync();

    // Set up periodic sync
    syncInterval = setInterval(async () => {
      await runSync();
    }, intervalMs);

  } catch (error) {
    console.error('❌ Error starting attendance sync job:', error);
  }
};

/**
 * Stop the periodic sync job
 */
const stopSyncJob = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('📅 Attendance auto-sync job stopped');
  }
};

/**
 * Run sync (internal function)
 */
const runSync = async () => {
  if (isRunning) {
    console.log('⏳ Attendance sync already running, skipping...');
    return;
  }

  try {
    isRunning = true;
    console.log('🔄 Starting attendance sync from MSSQL...');
    
    const stats = await syncAttendanceFromMSSQL();
    
    if (stats.success) {
      console.log(`✅ Attendance sync completed: ${stats.message}`);
    } else {
      console.error(`❌ Attendance sync failed: ${stats.message}`);
    }

  } catch (error) {
    console.error('❌ Error in attendance sync job:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Restart the sync job (call when settings change)
 */
const restartSyncJob = async () => {
  stopSyncJob();
  await startSyncJob();
};

module.exports = {
  startSyncJob,
  stopSyncJob,
  restartSyncJob,
  runSync,
};

