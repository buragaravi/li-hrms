'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import BulkUpload from '@/components/BulkUpload';
import {
  EMPLOYEE_TEMPLATE_HEADERS,
  EMPLOYEE_TEMPLATE_SAMPLE,
  validateEmployeeRow,
  ParsedRow,
} from '@/lib/bulkUpload';

interface Employee {
  emp_no: string;
  employee_name: string;
  department_id?: string;
  designation_id?: string;
  department?: { _id: string; name: string; code?: string };
  designation?: { _id: string; name: string; code?: string };
  doj?: string;
  dob?: string;
  gross_salary?: number;
  gender?: string;
  marital_status?: string;
  blood_group?: string;
  qualifications?: string;
  experience?: number;
  address?: string;
  location?: string;
  aadhar_number?: string;
  phone_number?: string;
  alt_phone_number?: string;
  email?: string;
  pf_number?: string;
  esi_number?: string;
  bank_account_no?: string;
  bank_name?: string;
  bank_place?: string;
  ifsc_code?: string;
  is_active?: boolean;
}

interface Department {
  _id: string;
  name: string;
  code?: string;
}

interface Designation {
  _id: string;
  name: string;
  code?: string;
  department: string;
}

const initialFormState: Partial<Employee> = {
  emp_no: '',
  employee_name: '',
  department_id: '',
  designation_id: '',
  doj: '',
  dob: '',
  gross_salary: undefined,
  gender: '',
  marital_status: '',
  blood_group: '',
  qualifications: '',
  experience: undefined,
  address: '',
  location: '',
  aadhar_number: '',
  phone_number: '',
  alt_phone_number: '',
  email: '',
  pf_number: '',
  esi_number: '',
  bank_account_no: '',
  bank_name: '',
  bank_place: '',
  ifsc_code: '',
  is_active: true,
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>(initialFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataSource, setDataSource] = useState<string>('mongodb');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      const filtered = designations.filter(d => d.department === formData.department_id);
      setFilteredDesignations(filtered);
      // Reset designation if it doesn't belong to selected department
      if (formData.designation_id && !filtered.find(d => d._id === formData.designation_id)) {
        setFormData(prev => ({ ...prev, designation_id: '' }));
      }
    } else {
      setFilteredDesignations([]);
    }
  }, [formData.department_id, designations]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.getEmployees();
      if (response.success) {
        setEmployees(response.data || []);
        setDataSource(response.dataSource || 'mongodb');
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.getDepartments(true);
      if (response.success && response.data) {
        setDepartments(response.data);
        // Load all designations
        const allDesignations: Designation[] = [];
        for (const dept of response.data) {
          const desigRes = await api.getDesignations(dept._id);
          if (desigRes.success && desigRes.data) {
            allDesignations.push(...desigRes.data.map((d: any) => ({ ...d, department: dept._id })));
          }
        }
        setDesignations(allDesignations);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.emp_no || !formData.employee_name) {
      setError('Employee No and Name are required');
      return;
    }

    try {
      let response;
      if (editingEmployee) {
        response = await api.updateEmployee(editingEmployee.emp_no, formData);
      } else {
        response = await api.createEmployee(formData);
      }

      if (response.success) {
        setSuccess(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
        setShowDialog(false);
        setEditingEmployee(null);
        setFormData(initialFormState);
        loadEmployees();
      } else {
        setError(response.message || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      ...employee,
      department_id: employee.department?._id || employee.department_id || '',
      designation_id: employee.designation?._id || employee.designation_id || '',
      doj: employee.doj ? new Date(employee.doj).toISOString().split('T')[0] : '',
      dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (empNo: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await api.deleteEmployee(empNo);
      if (response.success) {
        setSuccess('Employee deleted successfully!');
        loadEmployees();
      } else {
        setError(response.message || 'Failed to delete employee');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const openCreateDialog = () => {
    setEditingEmployee(null);
    setFormData(initialFormState);
    setShowDialog(true);
    setError('');
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#e2e8f01f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f01f_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-50/40 via-teal-50/35 to-transparent dark:from-slate-900/60 dark:via-slate-900/65 dark:to-slate-900/80" />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-5 shadow-[0_8px_26px_rgba(16,185,129,0.08)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Employee Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage employee records • Data source: <span className="font-medium text-emerald-600 dark:text-emerald-400">{dataSource.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="group relative inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50 hover:shadow-md dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Bulk Upload</span>
            </button>
            <button
              onClick={openCreateDialog}
              className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/40"
            >
              <span className="text-lg">+</span>
              <span>Add Employee</span>
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

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, employee no, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/95 py-16 shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-12 text-center shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No employees found</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add your first employee to get started</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-lg dark:border-slate-800 dark:bg-slate-950/95">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:border-slate-700 dark:from-slate-900 dark:to-emerald-900/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Emp No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Designation</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.emp_no} className="transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {employee.emp_no}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{employee.employee_name}</div>
                        {employee.email && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{employee.email}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {employee.designation?.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {employee.phone_number || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          employee.is_active !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {employee.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="mr-2 rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(employee.emp_no)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-3 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing <span className="font-medium">{filteredEmployees.length}</span> of <span className="font-medium">{employees.length}</span> employees
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Employee Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDialog(false)} />
          <div className="relative z-50 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingEmployee ? 'Update employee information' : 'Enter employee details below'}
                </p>
              </div>
              <button
                onClick={() => setShowDialog(false)}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Employee No *
                    </label>
                    <input
                      type="text"
                      name="emp_no"
                      value={formData.emp_no || ''}
                      onChange={handleInputChange}
                      required
                      disabled={!!editingEmployee}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm uppercase transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="E.g., EMP001"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Employee Name *
                    </label>
                    <input
                      type="text"
                      name="employee_name"
                      value={formData.employee_name || ''}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                    <select
                      name="department_id"
                      value={formData.department_id || ''}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Designation</label>
                    <select
                      name="designation_id"
                      value={formData.designation_id || ''}
                      onChange={handleInputChange}
                      disabled={!formData.department_id}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Designation</option>
                      {filteredDesignations.map((desig) => (
                        <option key={desig._id} value={desig._id}>{desig.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Joining</label>
                    <input
                      type="date"
                      name="doj"
                      value={formData.doj || ''}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                    <select name="gender" value={formData.gender || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Marital Status</label>
                    <select name="marital_status" value={formData.marital_status || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Blood Group</label>
                    <select name="blood_group" value={formData.blood_group || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Qualifications</label>
                    <input type="text" name="qualifications" value={formData.qualifications || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="E.g., B.Tech, MBA" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Experience (Years)</label>
                    <input type="number" name="experience" value={formData.experience || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                    <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                    <input type="text" name="location" value={formData.location || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Aadhar Number</label>
                    <input type="text" name="aadhar_number" value={formData.aadhar_number || ''} onChange={handleInputChange} maxLength={12} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>
              </div>

              {/* Contact & Employment */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact & Employment</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Alt. Phone</label>
                    <input type="text" name="alt_phone_number" value={formData.alt_phone_number || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Gross Salary</label>
                    <input type="number" name="gross_salary" value={formData.gross_salary || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">PF Number</label>
                    <input type="text" name="pf_number" value={formData.pf_number || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">ESI Number</label>
                    <input type="text" name="esi_number" value={formData.esi_number || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bank Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bank A/C No</label>
                    <input type="text" name="bank_account_no" value={formData.bank_account_no || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bank Name</label>
                    <input type="text" name="bank_name" value={formData.bank_name || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bank Place</label>
                    <input type="text" name="bank_place" value={formData.bank_place || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">IFSC Code</label>
                    <input type="text" name="ifsc_code" value={formData.ifsc_code || ''} onChange={handleInputChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm uppercase transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Employee
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-600"
                >
                  {editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Dialog */}
      {showBulkUpload && (
        <BulkUpload
          title="Bulk Upload Employees"
          templateHeaders={EMPLOYEE_TEMPLATE_HEADERS}
          templateSample={EMPLOYEE_TEMPLATE_SAMPLE}
          templateFilename="employee_template"
          columns={[
            { key: 'emp_no', label: 'Emp No', width: '100px' },
            { key: 'employee_name', label: 'Name', width: '150px' },
            { key: 'department_name', label: 'Department', type: 'select', options: departments.map(d => ({ value: d.name, label: d.name })), width: '150px' },
            { key: 'designation_name', label: 'Designation', width: '150px' },
            { key: 'doj', label: 'DOJ', type: 'date', width: '120px' },
            { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }], width: '100px' },
            { key: 'phone_number', label: 'Phone', width: '120px' },
            { key: 'email', label: 'Email', width: '180px' },
          ]}
          validateRow={(row) => {
            const result = validateEmployeeRow(row, departments, designations);
            return { isValid: result.isValid, errors: result.errors };
          }}
          onSubmit={async (data) => {
            let successCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            for (const row of data) {
              try {
                // Map department and designation names to IDs
                const deptId = departments.find(d => d.name.toLowerCase() === (row.department_name as string)?.toLowerCase())?._id;
                const desigId = designations.find(d => 
                  d.name.toLowerCase() === (row.designation_name as string)?.toLowerCase() &&
                  d.department === deptId
                )?._id;

                const employeeData = {
                  emp_no: row.emp_no,
                  employee_name: row.employee_name,
                  department_id: deptId || undefined,
                  designation_id: desigId || undefined,
                  doj: row.doj || undefined,
                  dob: row.dob || undefined,
                  gross_salary: row.gross_salary ? Number(row.gross_salary) : undefined,
                  gender: row.gender || undefined,
                  marital_status: row.marital_status || undefined,
                  blood_group: row.blood_group || undefined,
                  qualifications: row.qualifications || undefined,
                  experience: row.experience ? Number(row.experience) : undefined,
                  address: row.address || undefined,
                  location: row.location || undefined,
                  aadhar_number: row.aadhar_number || undefined,
                  phone_number: row.phone_number || undefined,
                  alt_phone_number: row.alt_phone_number || undefined,
                  email: row.email || undefined,
                  pf_number: row.pf_number || undefined,
                  esi_number: row.esi_number || undefined,
                  bank_account_no: row.bank_account_no || undefined,
                  bank_name: row.bank_name || undefined,
                  bank_place: row.bank_place || undefined,
                  ifsc_code: row.ifsc_code || undefined,
                };

                const response = await api.createEmployee(employeeData);
                if (response.success) {
                  successCount++;
                } else {
                  failCount++;
                  errors.push(`${row.emp_no}: ${response.message}`);
                }
              } catch (err) {
                failCount++;
                errors.push(`${row.emp_no}: Failed to create`);
              }
            }

            loadEmployees();

            if (failCount === 0) {
              return { success: true, message: `Successfully created ${successCount} employees` };
            } else {
              return { success: false, message: `Created ${successCount}, Failed ${failCount}. Errors: ${errors.slice(0, 3).join('; ')}` };
            }
          }}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
}

