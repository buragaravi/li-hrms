'use client';

import { useState, useEffect } from 'react';
import { api, Shift } from '@/lib/api';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [allowedDurations, setAllowedDurations] = useState<number[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [inputMode, setInputMode] = useState<'time' | 'duration'>('time');
  const [error, setError] = useState('');

  useEffect(() => {
    loadShifts();
    loadAllowedDurations();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const response = await api.getShifts();
      if (response.success && response.data) {
        setShifts(response.data);
      }
    } catch (err) {
      console.error('Error loading shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllowedDurations = async () => {
    try {
      const response = await api.getAllowedDurations();
      if (response.success && response.data) {
        setAllowedDurations(response.data);
      }
    } catch (err) {
      console.error('Error loading durations:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data: any = { name };

      if (inputMode === 'duration') {
        if (!startTime || !duration) {
          setError('Start time and duration are required');
          return;
        }
        data.startTime = startTime;
        data.duration = Number(duration);
      } else {
        if (!startTime || !endTime) {
          setError('Start time and end time are required');
          return;
        }
        data.startTime = startTime;
        data.endTime = endTime;
      }

      let response;
      if (editingShift) {
        response = await api.updateShift(editingShift._id, data);
      } else {
        response = await api.createShift(data);
      }

      if (response.success) {
        setShowForm(false);
        setEditingShift(null);
        resetForm();
        loadShifts();
      } else {
        setError(response.message || 'Failed to save shift');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setDuration(shift.duration);
    setInputMode('time');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const response = await api.deleteShift(id);
      if (response.success) {
        loadShifts();
      } else {
        alert(response.message || 'Failed to delete shift');
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
    }
  };

  const resetForm = () => {
    setName('');
    setStartTime('');
    setEndTime('');
    setDuration('');
    setInputMode('time');
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingShift(null);
    resetForm();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-light text-gray-900">Shift Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + Create Shift
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {editingShift ? 'Edit Shift' : 'Create New Shift'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="e.g., Morning Shift"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="time"
                    checked={inputMode === 'time'}
                    onChange={() => setInputMode('time')}
                    className="mr-2"
                  />
                  Start & End Time
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="duration"
                    checked={inputMode === 'duration'}
                    onChange={() => setInputMode('duration')}
                    className="mr-2"
                  />
                  Start Time & Duration
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {inputMode === 'time' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select duration</option>
                  {allowedDurations.map((dur) => (
                    <option key={dur} value={dur}>
                      {dur} hours
                    </option>
                  ))}
                </select>
                {allowedDurations.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No durations configured. Please configure durations in Settings.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingShift ? 'Update' : 'Create'} Shift
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No shifts found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shifts.map((shift) => (
                <tr key={shift._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shift.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shift.startTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shift.endTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shift.duration} hours</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        shift.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {shift.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(shift)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shift._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

