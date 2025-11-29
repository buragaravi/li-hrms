'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AttendanceRecord {
  date: string;
  inTime: string | null;
  outTime: string | null;
  totalHours: number | null;
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL';
}

interface Employee {
  _id: string;
  emp_no: string;
  employee_name: string;
  department?: { _id: string; name: string };
  designation?: { _id: string; name: string };
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceDetail, setAttendanceDetail] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showListView, setShowListView] = useState(false);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadAttendance();
    }
  }, [selectedEmployee, year, month]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.getEmployeesWithAttendance();
      if (response.success) {
        setEmployees(response.data || []);
        if (response.data && response.data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(response.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees');
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

  const handleDateClick = async (date: string) => {
    if (!selectedEmployee) return;
    
    setSelectedDate(date);
    try {
      const response = await api.getAttendanceDetail(selectedEmployee.emp_no, date);
      if (response.success) {
        setAttendanceDetail(response.data);
        setShowDetailDialog(true);
      }
    } catch (err) {
      console.error('Error loading attendance detail:', err);
      setError('Failed to load attendance detail');
    }
  };

  const loadAttendanceList = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoadingList(true);
      // Get last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      
      const response = await api.getAttendanceList(
        selectedEmployee.emp_no,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        1,
        100
      );
      if (response.success) {
        setAttendanceList(response.data || []);
      }
    } catch (err) {
      console.error('Error loading attendance list:', err);
      setError('Failed to load attendance list');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (showListView && selectedEmployee) {
      loadAttendanceList();
    }
  }, [showListView, selectedEmployee]);

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
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

  const getStatusColor = (date: string) => {
    const record = attendanceData[date];
    if (!record) return 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    if (record.status === 'PRESENT') return 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
    if (record.status === 'PARTIAL') return 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400';
    return 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
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
        // Reset file input
        const fileInput = document.getElementById('excel-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Reload attendance if employee is selected
        if (selectedEmployee) {
          loadAttendance();
        }
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#e2e8f01f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f01f_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-50/40 via-teal-50/35 to-transparent dark:from-slate-900/60 dark:via-slate-900/65 dark:to-slate-900/80" />

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-5 shadow-[0_8px_26px_rgba(16,185,129,0.08)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Attendance Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and manage employee attendance records
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadDialog(true)}
              className="group relative inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50 hover:shadow-md dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload Excel</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            success
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {success || error}
          </div>
        )}

        {/* Employee Selector */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Select Employee
          </label>
          <select
            value={selectedEmployee?.emp_no || ''}
            onChange={(e) => {
              const emp = employees.find(em => em.emp_no === e.target.value);
              setSelectedEmployee(emp || null);
            }}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select an employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp.emp_no}>
                {emp.emp_no} - {emp.employee_name}
              </option>
            ))}
          </select>
        </div>

        {/* Calendar */}
        {selectedEmployee && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
            {/* Calendar Header */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {monthNames[month - 1]} {year}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {loadingAttendance ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Day Names Header */}
                <div className="mb-2 grid grid-cols-7 gap-2">
                  {dayNames.map(day => (
                    <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth().map((dayData, index) => {
                    if (!dayData) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const record = attendanceData[dayData.date];
                    const isToday = dayData.date === new Date().toISOString().split('T')[0];
                    
                    return (
                      <button
                        key={dayData.date}
                        onClick={() => handleDateClick(dayData.date)}
                        className={`aspect-square rounded-xl border-2 p-2 text-sm font-medium transition-all hover:scale-105 ${
                          isToday
                            ? 'ring-2 ring-emerald-500 ring-offset-2'
                            : ''
                        } ${getStatusColor(dayData.date)}`}
                      >
                        <div className="flex h-full flex-col items-center justify-center">
                          <span>{dayData.day}</span>
                          {record && record.totalHours && (
                            <span className="mt-1 text-xs opacity-75">
                              {record.totalHours.toFixed(1)}h
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-green-300 bg-green-100 dark:border-green-800 dark:bg-green-900/20"></div>
                    <span className="text-slate-600 dark:text-slate-400">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-yellow-300 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20"></div>
                    <span className="text-slate-600 dark:text-slate-400">Partial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-red-300 bg-red-100 dark:border-red-800 dark:bg-red-900/20"></div>
                    <span className="text-slate-600 dark:text-slate-400">Absent</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Detail Dialog */}
        {showDetailDialog && attendanceDetail && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailDialog(false)} />
            <div className="relative z-50 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Attendance Detail - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedEmployee?.employee_name} ({selectedEmployee?.emp_no})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowListView(!showListView)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {showListView ? 'Calendar View' : 'List View'}
                  </button>
                  <button
                    onClick={() => setShowDetailDialog(false)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {showListView ? (
                <div className="space-y-4">
                  {loadingList ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                    </div>
                  ) : attendanceList.length === 0 ? (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">No attendance records found</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:border-slate-700 dark:from-slate-900 dark:to-emerald-900/10">
                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Date</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">In-Time</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Out-Time</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Hours</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {attendanceList.map((record) => (
                              <tr key={record.date} className="transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10">
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {record.inTime ? new Date(record.inTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {record.outTime ? new Date(record.outTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                    record.status === 'PRESENT'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : record.status === 'PARTIAL'
                                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {attendanceDetail.status}
                        </p>
                      </div>
                      {attendanceDetail.totalHours && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Hours</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {attendanceDetail.totalHours.toFixed(2)} hours
                          </p>
                        </div>
                      )}
                      {attendanceDetail.inTime && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">In-Time</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {new Date(attendanceDetail.inTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                      {attendanceDetail.outTime && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Out-Time</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {new Date(attendanceDetail.outTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Excel Upload Dialog */}
        {showUploadDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowUploadDialog(false)} />
            <div className="relative z-50 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Upload Attendance Excel
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Upload attendance logs from Excel file
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadDialog(false)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {success}
                </div>
              )}

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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Supported formats: .xlsx, .xls, .csv
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Excel Format Requirements:</h3>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <li>• <strong>Employee Number</strong> - Required column</li>
                    <li>• <strong>In-Time</strong> - Required column (timestamp)</li>
                    <li>• <strong>Out-Time</strong> - Optional column (timestamp)</li>
                  </ul>
                  <button
                    onClick={handleDownloadTemplate}
                    className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Download Template →
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleExcelUpload}
                    disabled={!uploadFile || uploading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadDialog(false);
                      setUploadFile(null);
                      setError('');
                      setSuccess('');
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

