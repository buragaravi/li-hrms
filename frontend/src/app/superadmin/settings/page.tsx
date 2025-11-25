'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type TabType = 'shift' | 'attendance' | 'payroll' | 'general';

interface ShiftDuration {
  _id: string;
  duration: number;
  label?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('shift');
  const [shiftDurations, setShiftDurations] = useState<ShiftDuration[]>([]);
  const [newDuration, setNewDuration] = useState<number | ''>('');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'shift') {
      loadShiftDurations();
    }
  }, [activeTab]);

  const loadShiftDurations = async () => {
    try {
      setLoading(true);
      const response = await api.getShiftDurations();
      if (response.success && response.data) {
        setShiftDurations(response.data.durations || []);
      }
    } catch (err) {
      console.error('Error loading durations:', err);
    } finally {
      setLoading(false);
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
        console.error(err);
      } finally {
        setSaving(false);
      }
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
      console.error(err);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'shift', label: 'Shift Settings' },
    { id: 'attendance', label: 'Attendance Settings' },
    { id: 'payroll', label: 'Payroll Settings' },
    { id: 'general', label: 'General Settings' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-light text-gray-900 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'shift' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Shift Durations</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure allowed shift durations. These durations will be available when creating shifts.
          </p>

          {message && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Duration
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Hours (e.g., 8)"
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Label (optional, e.g., Full Day)"
              />
              <button
                onClick={handleAddDuration}
                disabled={saving || !newDuration}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading durations...</div>
          ) : shiftDurations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No durations configured</div>
          ) : (
            <div className="space-y-2">
              {shiftDurations.map((duration) => (
                <div
                  key={duration._id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {duration.duration} hours
                    </span>
                    {duration.label && (
                      <span className="ml-2 text-sm text-gray-500">({duration.label})</span>
                    )}
                    {!duration.isActive && (
                      <span className="ml-2 text-xs text-gray-400">(Inactive)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteDuration(duration._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Attendance Settings</h2>
          <p className="text-sm text-gray-600">Attendance-related settings will be configured here.</p>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Payroll Settings</h2>
          <p className="text-sm text-gray-600">Payroll-related settings will be configured here.</p>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">General Settings</h2>
          <p className="text-sm text-gray-600">General system settings will be configured here.</p>
        </div>
      )}
    </div>
  );
}

