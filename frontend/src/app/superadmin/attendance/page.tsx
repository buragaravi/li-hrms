'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AttendanceRecord {
  date: string;
  inTime: string | null;
  outTime: string | null;
  totalHours: number | null;
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL';
  shiftId?: { _id: string; name: string; startTime: string; endTime: string; duration: number } | string | null;
  isLateIn?: boolean;
  isEarlyOut?: boolean;
  lateInMinutes?: number | null;
  earlyOutMinutes?: number | null;
  expectedHours?: number | null;
}

interface Employee {
  _id: string;
  emp_no: string;
  employee_name: string;
  department?: { _id: string; name: string };
  designation?: { _id: string; name: string };
}

interface MonthlyAttendanceData {
  employee: Employee;
  dailyAttendance: Record<string, AttendanceRecord | null>;
}

export default function AttendancePage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list'); // Default to list view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceDetail, setAttendanceDetail] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [syncingShifts, setSyncingShifts] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    if (viewMode === 'list') {
      loadMonthlyAttendance();
    } else if (viewMode === 'calendar' && selectedEmployee) {
      loadAttendance();
    }
  }, [viewMode, year, month, selectedEmployee]);

  const loadMonthlyAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getMonthlyAttendance(year, month);
      if (response.success) {
        setMonthlyData(response.data || []);
      } else {
        setError(response.message || 'Failed to load monthly attendance');
      }
    } catch (err: any) {
      console.error('Error loading monthly attendance:', err);
      setError(err.message || 'Failed to load monthly attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoadingAttendance(true);
      const response = await api.getAttendanceCalendar(selectedEmployee.emp_no, year, month);
      if (response.success) {
        setAttendanceData(response.data || {});
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleDateClick = async (employee: Employee, date: string) => {
    setSelectedDate(date);
    setSelectedEmployee(employee);
    try {
      const response = await api.getAttendanceDetail(employee.emp_no, date);
      if (response.success) {
        setAttendanceDetail(response.data);
        setShowDetailDialog(true);
      }
    } catch (err) {
      console.error('Error loading attendance detail:', err);
      setError('Failed to load attendance detail');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleExcelUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const response = await api.uploadAttendanceExcel(uploadFile);
      if (response.success) {
        setSuccess(response.message || 'File uploaded successfully');
        setUploadFile(null);
        setShowUploadDialog(false);
        const fileInput = document.getElementById('excel-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        loadMonthlyAttendance();
      } else {
        setError(response.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await api.downloadAttendanceTemplate();
      setSuccess('Template downloaded successfully');
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleSyncShifts = async () => {
    if (!confirm('This will sync shifts for all attendance records that don\'t have shifts assigned. This may take a few minutes. Continue?')) {
      return;
    }

    try {
      setSyncingShifts(true);
      setError('');
      setSuccess('');
      const response = await api.syncShifts();
      if (response.success) {
        setSuccess(response.message || `Processed ${response.data?.processed || 0} records: ${response.data?.assigned || 0} assigned, ${response.data?.confused || 0} flagged for review`);
        loadMonthlyAttendance();
      } else {
        setError(response.message || 'Failed to sync shifts');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during shift sync');
    } finally {
      setSyncingShifts(false);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = () => {
    const lastDay = new Date(year, month, 0);
    return lastDay.getDate();
  };

  const getCalendarDays = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
      });
    }
    
    return days;
  };

  const getStatusColor = (record: AttendanceRecord | null) => {
    if (!record) return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400';
    if (record.status === 'PRESENT') return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400';
    if (record.status === 'PARTIAL') return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-400';
    return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400';
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return time;
    }
  };

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return '-';
    return `${hours.toFixed(2)}h`;
  };

  const daysInMonth = getDaysInMonth();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#e2e8f01f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f01f_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-50/40 via-teal-50/35 to-transparent dark:from-slate-900/60 dark:via-slate-900/65 dark:to-slate-900/80" />

      <div className="relative z-10 mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance Management</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">View and manage employee attendance records</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                List View
              </button>
              <button
                onClick={() => {
                  setViewMode('calendar');
                  if (!selectedEmployee && monthlyData.length > 0) {
                    setSelectedEmployee(monthlyData[0].employee);
                  }
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar View
              </button>
            </div>

            {/* Month Selection */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => navigateMonth('prev')}
                className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                value={month}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(parseInt(e.target.value) - 1);
                  setCurrentDate(newDate);
                }}
                className="rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-medium text-slate-900 focus:outline-none focus:ring-0 dark:text-white"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(e.target.value));
                  setCurrentDate(newDate);
                }}
                className="rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-medium text-slate-900 focus:outline-none focus:ring-0 dark:text-white"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={() => navigateMonth('next')}
                className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Sync Shifts Button */}
            <button
              onClick={handleSyncShifts}
              disabled={syncingShifts}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {syncingShifts ? (
                <>
                  <div className="mr-2 inline h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Shifts
                </>
              )}
            </button>

            {/* Upload Excel Button */}
            <button
              onClick={() => setShowUploadDialog(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-600"
            >
              <svg className="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Excel
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl dark:border-slate-700 dark:bg-slate-900/80">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      <th className="sticky left-0 z-10 w-[180px] border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Employee
                      </th>
                      {daysArray.map((day) => (
                        <th
                          key={day}
                          className="w-[calc((100%-180px)/31)] border-r border-slate-200 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-700 last:border-r-0 dark:border-slate-700 dark:text-slate-300"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {monthlyData.map((item) => (
                      <tr key={item.employee._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                          <div>
                            <div className="font-semibold truncate">{item.employee.employee_name}</div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                              {item.employee.emp_no}
                              {item.employee.department && ` • ${(item.employee.department as any)?.name || ''}`}
                            </div>
                          </div>
                        </td>
                        {daysArray.map((day) => {
                          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = item.dailyAttendance[dateStr];
                          const shiftName = record?.shiftId && typeof record.shiftId === 'object' ? record.shiftId.name : '-';
                          return (
                            <td
                              key={day}
                              onClick={() => record && handleDateClick(item.employee, dateStr)}
                              className={`border-r border-slate-200 px-1 py-1.5 text-center last:border-r-0 dark:border-slate-700 ${
                                record ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''
                              } ${getStatusColor(record)}`}
                            >
                              {record ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-[9px]">{record.status === 'PRESENT' ? 'P' : record.status === 'PARTIAL' ? 'PT' : 'A'}</div>
                                  {shiftName !== '-' && (
                                    <div className="text-[8px] opacity-75 truncate" title={shiftName}>{shiftName.substring(0, 3)}</div>
                                  )}
                                  {record.totalHours !== null && (
                                    <div className="text-[8px] font-semibold">{formatHours(record.totalHours)}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[9px]">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/80">
            {!selectedEmployee ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                Please select an employee to view calendar
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedEmployee.employee_name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedEmployee.emp_no}
                      {selectedEmployee.department && ` • ${(selectedEmployee.department as any)?.name || ''}`}
                    </p>
                  </div>
                </div>

                {loadingAttendance ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {dayNames.map((day) => (
                      <div key={day} className="p-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {day}
                      </div>
                    ))}
                    {getCalendarDays().map((dayInfo) => {
                      if (!dayInfo) {
                        return <div key={`empty-${Math.random()}`} className="aspect-square"></div>;
                      }
                      const record = attendanceData[dayInfo.date];
                      return (
                        <div
                          key={dayInfo.date}
                          onClick={() => handleDateClick(selectedEmployee, dayInfo.date)}
                          className={`aspect-square cursor-pointer rounded-lg border-2 p-2 transition-all hover:scale-105 ${
                            record ? 'cursor-pointer' : ''
                          } ${getStatusColor(record)}`}
                        >
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="text-sm font-bold">{dayInfo.day}</div>
                            {record && (
                              <>
                                {record.shiftId && typeof record.shiftId === 'object' && (
                                  <div className="mt-1 text-[10px] font-medium opacity-75">
                                    {record.shiftId.name}
                                  </div>
                                )}
                                {record.totalHours !== null && (
                                  <div className="mt-1 text-[10px] font-semibold">
                                    {formatHours(record.totalHours)}
                                  </div>
                                )}
                                {record.isLateIn && record.lateInMinutes && (
                                  <div className="mt-1 text-[9px] text-orange-600 dark:text-orange-400">
                                    +{record.lateInMinutes}m
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Attendance Excel</h3>
              <button
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadFile(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Excel File
                </label>
                <input
                  id="excel-upload-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Download Template
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExcelUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadDialog(false);
                    setUploadFile(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && attendanceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Attendance Details - {selectedDate}
              </h3>
              <button
                onClick={() => setShowDetailDialog(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {attendanceDetail.status || 'ABSENT'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Shift</label>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {attendanceDetail.shiftId && typeof attendanceDetail.shiftId === 'object'
                      ? attendanceDetail.shiftId.name
                      : '-'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">In Time</label>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatTime(attendanceDetail.inTime)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Out Time</label>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatTime(attendanceDetail.outTime)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Hours</label>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatHours(attendanceDetail.totalHours)}
                  </div>
                </div>
                {attendanceDetail.isLateIn && attendanceDetail.lateInMinutes && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Late In</label>
                    <div className="mt-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                      +{attendanceDetail.lateInMinutes} minutes
                    </div>
                  </div>
                )}
                {attendanceDetail.isEarlyOut && attendanceDetail.earlyOutMinutes && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Early Out</label>
                    <div className="mt-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                      -{attendanceDetail.earlyOutMinutes} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
