/**
 * MSSQL Helper for Attendance Module
 * Handles fetching attendance logs from configured MSSQL database/table
 */

const sql = require('mssql');
const AttendanceSettings = require('../model/AttendanceSettings');

// Get MSSQL config for attendance database
const getAttendanceMSSQLConfig = async (databaseName) => {
  const server = process.env.SQL_SERVER || 'localhost';
  const port = parseInt(process.env.SQL_PORT) || 1433;

  return {
    server: server,
    port: port,
    database: databaseName,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: process.env.SQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true',
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
};

/**
 * Fetch attendance logs from MSSQL
 * @param {Object} settings - Attendance settings with MSSQL config
 * @param {Date} fromDate - Start date (optional)
 * @param {Date} toDate - End date (optional)
 * @returns {Array} Array of raw log records
 */
const fetchAttendanceLogsFromMSSQL = async (settings, fromDate = null, toDate = null) => {
  try {
    if (!settings.mssqlConfig.databaseName || !settings.mssqlConfig.tableName) {
      throw new Error('MSSQL database name and table name must be configured');
    }

    const config = await getAttendanceMSSQLConfig(settings.mssqlConfig.databaseName);
    const pool = await sql.connect(config);

    const mapping = settings.mssqlConfig.columnMapping;
    const empCol = mapping.employeeNumberColumn || 'EmployeeNumber';
    const timeCol = mapping.timestampColumn || 'Timestamp';
    const typeCol = mapping.typeColumn || 'Type';

    // Build query
    let query = `SELECT [${empCol}] as EmployeeNumber, [${timeCol}] as Timestamp`;
    
    if (mapping.hasTypeColumn && typeCol) {
      query += `, [${typeCol}] as Type`;
    }
    
    query += ` FROM [${settings.mssqlConfig.tableName}]`;

    // Add date filters if provided
    const conditions = [];
    if (fromDate) {
      conditions.push(`[${timeCol}] >= @fromDate`);
    }
    if (toDate) {
      conditions.push(`[${timeCol}] <= @toDate`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY [${empCol}], [${timeCol}]`;

    const request = pool.request();
    if (fromDate) {
      request.input('fromDate', sql.DateTime, fromDate);
    }
    if (toDate) {
      request.input('toDate', sql.DateTime, toDate);
    }

    const result = await request.query(query);
    await pool.close();

    return result.recordset.map(record => ({
      employeeNumber: String(record.EmployeeNumber || record.employeeNumber || '').trim().toUpperCase(),
      timestamp: record.Timestamp || record.timestamp,
      type: mapping.hasTypeColumn && record.Type ? (String(record.Type).toUpperCase() === 'IN' ? 'IN' : 'OUT') : null,
      rawData: record,
    })).filter(record => record.employeeNumber && record.timestamp);

  } catch (error) {
    console.error('Error fetching attendance logs from MSSQL:', error);
    throw error;
  }
};

/**
 * Check if MSSQL connection is available
 */
const isMSSQLAvailable = async (settings) => {
  try {
    if (!settings.mssqlConfig.databaseName || !settings.mssqlConfig.tableName) {
      return false;
    }
    const config = await getAttendanceMSSQLConfig(settings.mssqlConfig.databaseName);
    const pool = await sql.connect(config);
    await pool.close();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  fetchAttendanceLogsFromMSSQL,
  isMSSQLAvailable,
  getAttendanceMSSQLConfig,
};

