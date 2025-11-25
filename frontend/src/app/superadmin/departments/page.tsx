'use client';

import { useState, useEffect } from 'react';
import { api, Department } from '@/lib/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [hodId, setHodId] = useState('');
  const [hrId, setHrId] = useState('');
  const [attendanceConfig, setAttendanceConfig] = useState({
    lateInLimit: 0,
    earlyOutLimit: 0,
    lateInGraceTime: 15,
    earlyOutGraceTime: 15,
  });
  const [permissionPolicy, setPermissionPolicy] = useState({
    dailyLimit: 0,
    monthlyLimit: 0,
    deductFromSalary: false,
    deductionAmount: 0,
  });
  const [autoDeductionRules, setAutoDeductionRules] = useState<Array<{
    trigger: 'late_in' | 'early_out' | 'permission';
    count: number;
    action: 'half_day' | 'full_day' | 'deduct_amount';
    amount?: number;
  }>>([]);

  useEffect(() => {
    loadDepartments();
    loadUsers();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.getDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data: any = {
        name,
        code: code || undefined,
        description: description || undefined,
        hod: hodId || undefined,
        hr: hrId || undefined,
        attendanceConfig,
        permissionPolicy,
        autoDeductionRules,
      };

      let response;
      if (editingDepartment) {
        response = await api.updateDepartment(editingDepartment._id, data);
      } else {
        response = await api.createDepartment(data);
      }

      if (response.success) {
        setShowForm(false);
        setEditingDepartment(null);
        resetForm();
        loadDepartments();
      } else {
        setError(response.message || 'Failed to save department');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setCode(dept.code || '');
    setDescription(dept.description || '');
    setHodId(dept.hod?._id || '');
    setHrId(dept.hr?._id || '');
    setAttendanceConfig(dept.attendanceConfig);
    setPermissionPolicy(dept.permissionPolicy);
    setAutoDeductionRules(dept.autoDeductionRules || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await api.deleteDepartment(id);
      if (response.success) {
        loadDepartments();
      } else {
        alert(response.message || 'Failed to delete department');
      }
    } catch (err) {
      console.error('Error deleting department:', err);
    }
  };

  const handleAddDeductionRule = () => {
    setAutoDeductionRules([
      ...autoDeductionRules,
      { trigger: 'late_in', count: 3, action: 'half_day' },
    ]);
  };

  const handleRemoveDeductionRule = (index: number) => {
    setAutoDeductionRules(autoDeductionRules.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setHodId('');
    setHrId('');
    setAttendanceConfig({
      lateInLimit: 0,
      earlyOutLimit: 0,
      lateInGraceTime: 15,
      earlyOutGraceTime: 15,
    });
    setPermissionPolicy({
      dailyLimit: 0,
      monthlyLimit: 0,
      deductFromSalary: false,
      deductionAmount: 0,
    });
    setAutoDeductionRules([]);
    setError('');
  };

  const hodUsers = users.filter((u) => u.role === 'hod' || u.roles?.includes('hod'));
  const hrUsers = users.filter((u) => u.role === 'hr' || u.roles?.includes('hr'));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-light text-gray-900">Department Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + Create Department
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {editingDepartment ? 'Edit Department' : 'Create New Department'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g., IT, HR, FIN"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Head of Department (HOD)
                </label>
                <select
                  value={hodId}
                  onChange={(e) => setHodId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select HOD</option>
                  {hodUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HR Manager
                </label>
                <select
                  value={hrId}
                  onChange={(e) => setHrId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select HR</option>
                  {hrUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Configuration */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late-In Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceConfig.lateInLimit}
                    onChange={(e) =>
                      setAttendanceConfig({
                        ...attendanceConfig,
                        lateInLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Allowed late-ins before deduction</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Early-Out Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceConfig.earlyOutLimit}
                    onChange={(e) =>
                      setAttendanceConfig({
                        ...attendanceConfig,
                        earlyOutLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Allowed early-outs before deduction</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late-In Grace Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceConfig.lateInGraceTime}
                    onChange={(e) =>
                      setAttendanceConfig({
                        ...attendanceConfig,
                        lateInGraceTime: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Early-Out Grace Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceConfig.earlyOutGraceTime}
                    onChange={(e) =>
                      setAttendanceConfig({
                        ...attendanceConfig,
                        earlyOutGraceTime: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>

            {/* Permission Policy */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Policy</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Limit (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={permissionPolicy.dailyLimit}
                    onChange={(e) =>
                      setPermissionPolicy({
                        ...permissionPolicy,
                        dailyLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Limit (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={permissionPolicy.monthlyLimit}
                    onChange={(e) =>
                      setPermissionPolicy({
                        ...permissionPolicy,
                        monthlyLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissionPolicy.deductFromSalary}
                      onChange={(e) =>
                        setPermissionPolicy({
                          ...permissionPolicy,
                          deductFromSalary: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Deduct from Salary
                    </span>
                  </label>
                </div>

                {permissionPolicy.deductFromSalary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deduction Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={permissionPolicy.deductionAmount}
                      onChange={(e) =>
                        setPermissionPolicy({
                          ...permissionPolicy,
                          deductionAmount: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Deduction Rules */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Auto-Deduction Rules</h3>
                <button
                  type="button"
                  onClick={handleAddDeductionRule}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Rule
                </button>
              </div>

              {autoDeductionRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 mb-2 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={rule.trigger}
                    onChange={(e) => {
                      const newRules = [...autoDeductionRules];
                      newRules[index].trigger = e.target.value as any;
                      setAutoDeductionRules(newRules);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="late_in">Late-In</option>
                    <option value="early_out">Early-Out</option>
                    <option value="permission">Permission</option>
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={rule.count}
                    onChange={(e) => {
                      const newRules = [...autoDeductionRules];
                      newRules[index].count = Number(e.target.value);
                      setAutoDeductionRules(newRules);
                    }}
                    placeholder="Count"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />

                  <select
                    value={rule.action}
                    onChange={(e) => {
                      const newRules = [...autoDeductionRules];
                      newRules[index].action = e.target.value as any;
                      setAutoDeductionRules(newRules);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="half_day">Half Day</option>
                    <option value="full_day">Full Day</option>
                    <option value="deduct_amount">Deduct Amount</option>
                  </select>

                  <div className="flex gap-2">
                    {rule.action === 'deduct_amount' && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule.amount || 0}
                        onChange={(e) => {
                          const newRules = [...autoDeductionRules];
                          newRules[index].amount = Number(e.target.value);
                          setAutoDeductionRules(newRules);
                        }}
                        placeholder="Amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDeductionRule(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {autoDeductionRules.length === 0 && (
                <p className="text-sm text-gray-500">No auto-deduction rules configured</p>
              )}
            </div>

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
                {editingDepartment ? 'Update' : 'Create'} Department
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingDepartment(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No departments found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HOD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                    {dept.description && (
                      <div className="text-xs text-gray-500">{dept.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {dept.code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {dept.hod?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {dept.hr?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        dept.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setShowConfig(showConfig === dept._id ? null : dept._id)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Config
                    </button>
                    <button
                      onClick={() => handleEdit(dept)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept._id)}
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

      {/* Configuration View */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-medium text-gray-900">Department Configuration</h2>
              <button
                onClick={() => setShowConfig(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {departments
              .filter((d) => d._id === showConfig)
              .map((dept) => (
                <div key={dept._id} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Configuration</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Late-In Limit:</span>
                        <span className="ml-2 font-medium">{dept.attendanceConfig.lateInLimit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Early-Out Limit:</span>
                        <span className="ml-2 font-medium">{dept.attendanceConfig.earlyOutLimit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Late-In Grace Time:</span>
                        <span className="ml-2 font-medium">{dept.attendanceConfig.lateInGraceTime} min</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Early-Out Grace Time:</span>
                        <span className="ml-2 font-medium">{dept.attendanceConfig.earlyOutGraceTime} min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Permission Policy</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Daily Limit:</span>
                        <span className="ml-2 font-medium">
                          {dept.permissionPolicy.dailyLimit || 'Unlimited'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Monthly Limit:</span>
                        <span className="ml-2 font-medium">
                          {dept.permissionPolicy.monthlyLimit || 'Unlimited'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Deduct from Salary:</span>
                        <span className="ml-2 font-medium">
                          {dept.permissionPolicy.deductFromSalary ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {dept.permissionPolicy.deductFromSalary && (
                        <div>
                          <span className="text-gray-600">Deduction Amount:</span>
                          <span className="ml-2 font-medium">
                            {dept.permissionPolicy.deductionAmount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Auto-Deduction Rules</h3>
                    {dept.autoDeductionRules && dept.autoDeductionRules.length > 0 ? (
                      <div className="space-y-2">
                        {dept.autoDeductionRules.map((rule, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-medium">
                              {rule.count} {rule.trigger.replace('_', ' ')} = {rule.action.replace('_', ' ')}
                            </span>
                            {rule.amount && <span className="ml-2">(Amount: {rule.amount})</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No auto-deduction rules configured</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
