'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type TabType = 'shift' | 'employee' | 'attendance' | 'payroll' | 'general';

interface ShiftDuration {
  _id: string;
  duration: number;
  label?: string;
  isActive: boolean;
}

// Icon Components
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('shift');
  const [shiftDurations, setShiftDurations] = useState<ShiftDuration[]>([]);
  const [newDuration, setNewDuration] = useState<number | ''>('');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit modal state
  const [editingDuration, setEditingDuration] = useState<ShiftDuration | null>(null);
  const [editDuration, setEditDuration] = useState<number | ''>('');
  const [editLabel, setEditLabel] = useState('');

  // Employee settings state
  const [employeeDataSource, setEmployeeDataSource] = useState<string>('mongodb');
  const [employeeDeleteTarget, setEmployeeDeleteTarget] = useState<string>('both');
  const [mssqlConnected, setMssqlConnected] = useState(false);
  const [employeeSettingsLoading, setEmployeeSettingsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'shift') {
      loadShiftDurations();
    } else if (activeTab === 'employee') {
      loadEmployeeSettings();
    }
  }, [activeTab]);

  const loadShiftDurations = async () => {
    try {
      setLoading(true);
      const response = await api.getShiftDurations();
      
      if (response.success) {
        const durations = response.durations || [];
        setShiftDurations(Array.isArray(durations) ? durations : []);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load shift durations' });
        setShiftDurations([]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred while loading durations' });
      setShiftDurations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeSettings = async () => {
    try {
      setEmployeeSettingsLoading(true);
      
      // Get current employee settings
      const empSettingsRes = await api.getEmployeeSettings();
      if (empSettingsRes.success && empSettingsRes.data) {
        setEmployeeDataSource(empSettingsRes.data.dataSource || 'mongodb');
        setEmployeeDeleteTarget(empSettingsRes.data.deleteTarget || 'both');
        setMssqlConnected(empSettingsRes.data.mssqlConnected || false);
      }
    } catch (err) {
      console.error('Error loading employee settings:', err);
    } finally {
      setEmployeeSettingsLoading(false);
    }
  };

  const handleSaveEmployeeSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Save data source setting
      await api.upsertSetting({
        key: 'employee_data_source',
        value: employeeDataSource,
        description: 'Source database for fetching employee data',
        category: 'employee',
      });

      // Save delete target setting
      await api.upsertSetting({
        key: 'employee_delete_target',
        value: employeeDeleteTarget,
        description: 'Target database(s) for employee deletion',
        category: 'employee',
      });

      setMessage({ type: 'success', text: 'Employee settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save employee settings' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDuration = async () => {
    if (newDuration && Number(newDuration) > 0) {
      try {
        setSaving(true);
        setMessage(null);

        const response = await api.createShiftDuration({
          duration: Number(newDuration),
          label: newLabel || `${newDuration} hours`,
        });

        if (response.success) {
          setNewDuration('');
          setNewLabel('');
          setMessage({ type: 'success', text: 'Duration added successfully!' });
          loadShiftDurations();
        } else {
          setMessage({ type: 'error', text: response.message || 'Failed to add duration' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'An error occurred' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEditClick = (duration: ShiftDuration) => {
    setEditingDuration(duration);
    setEditDuration(duration.duration);
    setEditLabel(duration.label || '');
  };

  const handleEditSave = async () => {
    if (!editingDuration || !editDuration) return;

    try {
      setSaving(true);
      const response = await api.updateShiftDuration(editingDuration._id, {
        duration: Number(editDuration),
        label: editLabel || `${editDuration} hours`,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Duration updated successfully!' });
        setEditingDuration(null);
        loadShiftDurations();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update duration' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDuration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this duration?')) return;

    try {
      const response = await api.deleteShiftDuration(id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Duration deleted successfully!' });
        loadShiftDurations();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete duration' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'shift', label: 'Shift' },
    { id: 'employee', label: 'Employee' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'general', label: 'General' },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#e2e8f01f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f01f_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-blue-50/40 via-indigo-50/35 to-transparent dark:from-slate-900/60 dark:via-slate-900/65 dark:to-slate-900/80" />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Header Section */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-5 shadow-[0_8px_26px_rgba(30,64,175,0.08)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Configure system settings and preferences
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'shift' && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Shift Durations</h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              Configure allowed shift durations. These durations will be available when creating shifts.
            </p>

            {message && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 dark:border-slate-700 dark:from-slate-900/50 dark:to-blue-900/10">
              <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Add New Duration
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Hours"
                />
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Label (e.g., Full Day)"
                />
                <button
                  onClick={handleAddDuration}
                  disabled={saving || !newDuration}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 py-12 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading durations...</p>
              </div>
            ) : shiftDurations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">No durations configured</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {shiftDurations.map((duration) => (
                  <div
                    key={duration._id}
                    className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {duration.duration}h
                      </span>
                      {duration.label && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{duration.label}</span>
                      )}
                    </div>

                    {!duration.isActive && (
                      <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Off
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(duration)}
                        className="relative rounded-lg p-1.5 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteDuration(duration._id)}
                        className="relative rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'employee' && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Employee Settings</h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              Configure how employee data is stored and retrieved between MongoDB and MSSQL databases.
            </p>

            {message && (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* MSSQL Connection Status */}
            <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${
              mssqlConnected 
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            }`}>
              <div className={`h-3 w-3 rounded-full ${mssqlConnected ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className={`text-sm font-medium ${
                mssqlConnected 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                MSSQL (HRMS Database): {mssqlConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {employeeSettingsLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 py-12 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Data Source Setting */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 dark:border-slate-700 dark:from-slate-900/50 dark:to-blue-900/10">
                  <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Data Source (for fetching employees)
                  </label>
                  <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Choose which database to fetch employee data from when viewing the employee list.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'mongodb', label: 'MongoDB', desc: 'Fetch from MongoDB database' },
                      { value: 'mssql', label: 'MSSQL', desc: 'Fetch from SQL Server (HRMS)' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                          employeeDataSource === option.value
                            ? 'border-blue-400 bg-blue-50 shadow-md dark:border-blue-600 dark:bg-blue-900/30'
                            : 'border-slate-200 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dataSource"
                          value={option.value}
                          checked={employeeDataSource === option.value}
                          onChange={(e) => setEmployeeDataSource(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{option.label}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{option.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Delete Target Setting */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-red-50/30 p-5 dark:border-slate-700 dark:from-slate-900/50 dark:to-red-900/10">
                  <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Delete From (when deleting employees)
                  </label>
                  <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Choose which database(s) to delete employee data from when removing an employee.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'mongodb', label: 'MongoDB Only', desc: 'Delete from MongoDB only' },
                      { value: 'mssql', label: 'MSSQL Only', desc: 'Delete from SQL Server only' },
                      { value: 'both', label: 'Both Databases', desc: 'Delete from both databases' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                          employeeDeleteTarget === option.value
                            ? 'border-red-400 bg-red-50 shadow-md dark:border-red-600 dark:bg-red-900/30'
                            : 'border-slate-200 bg-white hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteTarget"
                          value={option.value}
                          checked={employeeDeleteTarget === option.value}
                          onChange={(e) => setEmployeeDeleteTarget(e.target.value)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{option.label}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{option.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <h4 className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">ℹ️ How it works</h4>
                  <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                    <li>• <strong>Create/Update:</strong> Always saves to BOTH databases for data consistency</li>
                    <li>• <strong>Read:</strong> Fetches from your selected data source</li>
                    <li>• <strong>Delete:</strong> Removes from your selected target database(s)</li>
                  </ul>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEmployeeSettings}
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Employee Settings'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Attendance Settings</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Attendance-related settings will be configured here.</p>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Payroll Settings</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Payroll-related settings will be configured here.</p>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950/95 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">General Settings</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">General system settings will be configured here.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingDuration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Duration</h3>
              <button
                onClick={() => setEditingDuration(null)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Label
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="e.g., Full Day"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingDuration(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={saving || !editDuration}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
