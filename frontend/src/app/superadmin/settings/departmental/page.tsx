'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

interface Department {
  _id: string;
  name: string;
  code?: string;
}

interface DepartmentSettings {
  _id?: string;
  department: Department | string;
  leaves: {
    leavesPerDay: number | null;
    paidLeavesCount: number | null;
    dailyLimit: number | null;
    monthlyLimit: number | null;
  };
  loans: {
    interestRate: number | null;
    isInterestApplicable: boolean | null;
    minTenure: number | null;
    maxTenure: number | null;
    minAmount: number | null;
    maxAmount: number | null;
    maxPerEmployee: number | null;
    maxActivePerEmployee: number | null;
    minServicePeriod: number | null;
  };
  salaryAdvance: {
    interestRate: number | null;
    isInterestApplicable: boolean | null;
    minTenure: number | null;
    maxTenure: number | null;
    minAmount: number | null;
    maxAmount: number | null;
    maxPerEmployee: number | null;
    maxActivePerEmployee: number | null;
    minServicePeriod: number | null;
  };
  permissions: {
    perDayLimit: number | null;
    monthlyLimit: number | null;
    deductFromSalary: boolean | null;
    deductionAmount: number | null;
  };
}

export default function DepartmentalSettingsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DepartmentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    leaves: DepartmentSettings['leaves'];
    loans: DepartmentSettings['loans'];
    salaryAdvance: DepartmentSettings['salaryAdvance'];
    permissions: DepartmentSettings['permissions'];
  }>({
    leaves: {
      leavesPerDay: null,
      paidLeavesCount: null,
      dailyLimit: null,
      monthlyLimit: null,
    },
    loans: {
      interestRate: null,
      isInterestApplicable: null,
      minTenure: null,
      maxTenure: null,
      minAmount: null,
      maxAmount: null,
      maxPerEmployee: null,
      maxActivePerEmployee: null,
      minServicePeriod: null,
    },
    salaryAdvance: {
      interestRate: null,
      isInterestApplicable: null,
      minTenure: null,
      maxTenure: null,
      minAmount: null,
      maxAmount: null,
      maxPerEmployee: null,
      maxActivePerEmployee: null,
      minServicePeriod: null,
    },
    permissions: {
      perDayLimit: null,
      monthlyLimit: null,
      deductFromSalary: null,
      deductionAmount: null,
    },
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) {
      loadDepartmentSettings(selectedDepartmentId);
    } else {
      setSettings(null);
      resetForm();
    }
  }, [selectedDepartmentId]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.getDepartments(true);
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentSettings = async (deptId: string) => {
    try {
      setLoadingSettings(true);
      const response = await api.getDepartmentSettings(deptId);
      if (response.success && response.data) {
        setSettings(response.data);
        // Populate form with existing settings
        const s = response.data;
        setFormData({
          leaves: {
            leavesPerDay: s.leaves?.leavesPerDay ?? null,
            paidLeavesCount: s.leaves?.paidLeavesCount ?? null,
            dailyLimit: s.leaves?.dailyLimit ?? null,
            monthlyLimit: s.leaves?.monthlyLimit ?? null,
          },
          loans: {
            interestRate: s.loans?.interestRate ?? null,
            isInterestApplicable: s.loans?.isInterestApplicable ?? null,
            minTenure: s.loans?.minTenure ?? null,
            maxTenure: s.loans?.maxTenure ?? null,
            minAmount: s.loans?.minAmount ?? null,
            maxAmount: s.loans?.maxAmount ?? null,
            maxPerEmployee: s.loans?.maxPerEmployee ?? null,
            maxActivePerEmployee: s.loans?.maxActivePerEmployee ?? null,
            minServicePeriod: s.loans?.minServicePeriod ?? null,
          },
          salaryAdvance: {
            interestRate: s.salaryAdvance?.interestRate ?? null,
            isInterestApplicable: s.salaryAdvance?.isInterestApplicable ?? null,
            minTenure: s.salaryAdvance?.minTenure ?? null,
            maxTenure: s.salaryAdvance?.maxTenure ?? null,
            minAmount: s.salaryAdvance?.minAmount ?? null,
            maxAmount: s.salaryAdvance?.maxAmount ?? null,
            maxPerEmployee: s.salaryAdvance?.maxPerEmployee ?? null,
            maxActivePerEmployee: s.salaryAdvance?.maxActivePerEmployee ?? null,
            minServicePeriod: s.salaryAdvance?.minServicePeriod ?? null,
          },
          permissions: {
            perDayLimit: s.permissions?.perDayLimit ?? null,
            monthlyLimit: s.permissions?.monthlyLimit ?? null,
            deductFromSalary: s.permissions?.deductFromSalary ?? null,
            deductionAmount: s.permissions?.deductionAmount ?? null,
          },
        });
      }
    } catch (error) {
      console.error('Error loading department settings:', error);
      toast.error('Failed to load department settings');
      resetForm();
    } finally {
      setLoadingSettings(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leaves: {
        leavesPerDay: null,
        paidLeavesCount: null,
        dailyLimit: null,
        monthlyLimit: null,
      },
      loans: {
        interestRate: null,
        isInterestApplicable: null,
        minTenure: null,
        maxTenure: null,
        minAmount: null,
        maxAmount: null,
        maxPerEmployee: null,
        maxActivePerEmployee: null,
        minServicePeriod: null,
      },
      salaryAdvance: {
        interestRate: null,
        isInterestApplicable: null,
        minTenure: null,
        maxTenure: null,
        minAmount: null,
        maxAmount: null,
        maxPerEmployee: null,
        maxActivePerEmployee: null,
        minServicePeriod: null,
      },
      permissions: {
        perDayLimit: null,
        monthlyLimit: null,
        deductFromSalary: null,
        deductionAmount: null,
      },
    });
  };

  const handleInputChange = (section: 'leaves' | 'loans' | 'salaryAdvance' | 'permissions', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value === '' ? null : value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedDepartmentId) {
      toast.error('Please select a department');
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API
      const updateData = {
        leaves: formData.leaves,
        loans: formData.loans,
        salaryAdvance: formData.salaryAdvance,
        permissions: formData.permissions,
      };

      const response = await api.updateDepartmentSettings(selectedDepartmentId, updateData);

      if (response.success) {
        toast.success('Department settings saved successfully!');
        // Reload settings
        await loadDepartmentSettings(selectedDepartmentId);
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const selectedDepartment = departments.find(d => d._id === selectedDepartmentId);

  return (
    <div className="max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departmental Settings</h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Configure department-specific settings for leaves, loans, salary advances, and permissions
        </p>
      </div>

      {/* Department Selection */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Select Department
        </label>
        <select
          value={selectedDepartmentId}
          onChange={(e) => setSelectedDepartmentId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          disabled={loading}
        >
          <option value="">-- Select a Department --</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name} {dept.code ? `(${dept.code})` : ''}
            </option>
          ))}
        </select>
        {selectedDepartment && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Configure settings for <span className="font-medium text-emerald-600 dark:text-emerald-400">{selectedDepartment.name}</span>
          </p>
        )}
      </div>

      {loadingSettings ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">Loading settings...</span>
        </div>
      ) : selectedDepartmentId ? (
        <div className="space-y-4">
          {/* Leaves Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Leaves Settings</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Leaves Per Day (Accrual Rate)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.leaves.leavesPerDay ?? ''}
                  onChange={(e) => handleInputChange('leaves', 'leavesPerDay', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 1.5, 2.0, 2.5"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Leave blank to use global default</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Paid Leaves Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leaves.paidLeavesCount ?? ''}
                  onChange={(e) => handleInputChange('leaves', 'paidLeavesCount', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 12, 15"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Total paid leaves per year</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Daily Leave Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leaves.dailyLimit ?? ''}
                  onChange={(e) => handleInputChange('leaves', 'dailyLimit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0 = unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Monthly Leave Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leaves.monthlyLimit ?? ''}
                  onChange={(e) => handleInputChange('leaves', 'monthlyLimit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0 = unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Loans Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Loans Settings</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.loans.interestRate ?? ''}
                  onChange={(e) => handleInputChange('loans', 'interestRate', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 8, 10"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Is Interest Applicable
                </label>
                <select
                  value={formData.loans.isInterestApplicable === null ? '' : formData.loans.isInterestApplicable ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('loans', 'isInterestApplicable', e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Use Global Default</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Min Tenure (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.loans.minTenure ?? ''}
                  onChange={(e) => handleInputChange('loans', 'minTenure', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 12"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Tenure (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.loans.maxTenure ?? ''}
                  onChange={(e) => handleInputChange('loans', 'maxTenure', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 24"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.loans.minAmount ?? ''}
                  onChange={(e) => handleInputChange('loans', 'minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 1000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.loans.maxAmount ?? ''}
                  onChange={(e) => handleInputChange('loans', 'maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Leave blank for unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Per Employee (Lifetime)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.loans.maxPerEmployee ?? ''}
                  onChange={(e) => handleInputChange('loans', 'maxPerEmployee', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Leave blank for unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Active Loans Per Employee
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.loans.maxActivePerEmployee ?? ''}
                  onChange={(e) => handleInputChange('loans', 'maxActivePerEmployee', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Min Service Period (Months)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.loans.minServicePeriod ?? ''}
                  onChange={(e) => handleInputChange('loans', 'minServicePeriod', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 6"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Salary Advance Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Salary Advance Settings</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.salaryAdvance.interestRate ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'interestRate', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 8, 10"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Is Interest Applicable
                </label>
                <select
                  value={formData.salaryAdvance.isInterestApplicable === null ? '' : formData.salaryAdvance.isInterestApplicable ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('salaryAdvance', 'isInterestApplicable', e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Use Global Default</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Min Tenure (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.salaryAdvance.minTenure ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'minTenure', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Tenure (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.salaryAdvance.maxTenure ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'maxTenure', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 3"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryAdvance.minAmount ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 1000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryAdvance.maxAmount ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Leave blank for unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Per Employee (Lifetime)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryAdvance.maxPerEmployee ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'maxPerEmployee', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Leave blank for unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Max Active Advances Per Employee
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.salaryAdvance.maxActivePerEmployee ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'maxActivePerEmployee', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Min Service Period (Months)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryAdvance.minServicePeriod ?? ''}
                  onChange={(e) => handleInputChange('salaryAdvance', 'minServicePeriod', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 0"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Permissions Settings */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Permissions Settings</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Permissions Per Day Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.permissions.perDayLimit ?? ''}
                  onChange={(e) => handleInputChange('permissions', 'perDayLimit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0 = unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Monthly Permission Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyLimit ?? ''}
                  onChange={(e) => handleInputChange('monthlyLimit', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0 = unlimited"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Deduct From Salary
                </label>
                <select
                  value={formData.permissions.deductFromSalary === null ? '' : formData.permissions.deductFromSalary ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('permissions', 'deductFromSalary', e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Use Global Default</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Deduction Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.permissions.deductionAmount ?? ''}
                  onChange={(e) => handleInputChange('permissions', 'deductionAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Amount per permission"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setSelectedDepartmentId('');
                resetForm();
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">Select a Department</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Please select a department from the dropdown above to configure its settings
          </p>
        </div>
      )}
    </div>
  );
}

