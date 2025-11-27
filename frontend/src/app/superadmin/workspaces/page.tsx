'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ModulesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface Module {
  _id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  isActive: boolean;
  isSystem: boolean;
}

interface WorkspaceModule {
  moduleId: any;
  moduleCode: string;
  permissions: {
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canApprove?: boolean;
    canForward?: boolean;
    canExport?: boolean;
  };
  dataScope: string;
  isEnabled: boolean;
  sortOrder: number;
}

interface Workspace {
  _id: string;
  name: string;
  code: string;
  type: string;
  description: string;
  modules: WorkspaceModule[];
  defaultModuleCode?: string;
  theme?: {
    primaryColor?: string;
    icon?: string;
  };
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
}

const getWorkspaceTypeColor = (type: string) => {
  switch (type) {
    case 'employee':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'department':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'hr':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'subadmin':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'superadmin':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
  }
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showModulesDialog, setShowModulesDialog] = useState(false);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'employee',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workspacesRes, modulesRes] = await Promise.all([
        api.getWorkspaces(),
        api.getModules(),
      ]);

      if (workspacesRes.success) {
        setWorkspaces(workspacesRes.data || []);
      }
      if (modulesRes.success) {
        setModules(modulesRes.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.createWorkspace(formData);
      if (response.success) {
        setSuccess('Workspace created successfully');
        setShowCreateDialog(false);
        setFormData({ name: '', code: '', type: 'employee', description: '' });
        loadData();
      } else {
        setError(response.error || 'Failed to create workspace');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;
    setError('');
    
    try {
      const response = await api.updateWorkspace(selectedWorkspace._id, formData);
      if (response.success) {
        setSuccess('Workspace updated successfully');
        setShowEditDialog(false);
        setSelectedWorkspace(null);
        loadData();
      } else {
        setError(response.error || 'Failed to update workspace');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    if (workspace.isSystem) {
      setError('Cannot delete system workspace');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${workspace.name}"?`)) return;
    
    try {
      const response = await api.deleteWorkspace(workspace._id);
      if (response.success) {
        setSuccess('Workspace deleted successfully');
        loadData();
      } else {
        setError(response.error || 'Failed to delete workspace');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete workspace');
    }
  };

  const openEditDialog = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name,
      code: workspace.code,
      type: workspace.type,
      description: workspace.description || '',
    });
    setShowEditDialog(true);
  };

  const openModulesDialog = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowModulesDialog(true);
  };

  const openUsersDialog = async (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowUsersDialog(true);
    
    try {
      const response = await api.getWorkspaceUsers(workspace._id);
      if (response.success) {
        setWorkspaceUsers(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load workspace users:', err);
    }
  };

  const handleToggleModule = async (workspace: Workspace, moduleCode: string, isEnabled: boolean) => {
    try {
      const existingModule = workspace.modules.find(m => m.moduleCode === moduleCode);
      
      if (existingModule) {
        // Update existing module
        const response = await api.updateWorkspaceModule(workspace._id, moduleCode, { isEnabled });
        if (response.success) {
          loadData();
        }
      } else if (isEnabled) {
        // Add new module
        const mod = modules.find(m => m.code === moduleCode);
        if (mod) {
          const response = await api.addModuleToWorkspace(workspace._id, {
            moduleId: mod._id,
            permissions: { canView: true },
            dataScope: 'own',
          });
          if (response.success) {
            loadData();
          }
        }
      }
    } catch (err) {
      console.error('Failed to update module:', err);
    }
  };

  const clearMessages = () => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  useEffect(() => {
    if (error || success) {
      clearMessages();
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Management</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage workspaces with their modules and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshIcon />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl"
            >
              <PlusIcon />
              Create Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{workspaces.length}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Workspaces</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-3xl font-bold text-blue-600">{workspaces.filter(w => w.isActive).length}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Active Workspaces</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-3xl font-bold text-purple-600">{modules.length}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">System Modules</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-3xl font-bold text-emerald-600">{workspaces.filter(w => w.isSystem).length}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">System Workspaces</div>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <div
            key={workspace._id}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{workspace.name}</h3>
                  {workspace.isSystem && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded dark:bg-slate-700 dark:text-slate-400">
                      System
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Code: {workspace.code}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize ${getWorkspaceTypeColor(workspace.type)}`}>
                {workspace.type}
              </span>
            </div>

            {workspace.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                {workspace.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">
                <ModulesIcon />
                {workspace.modules?.filter(m => m.isEnabled).length || 0} modules
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                workspace.isActive
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {workspace.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => openModulesDialog(workspace)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                <ModulesIcon />
                Modules
              </button>
              <button
                onClick={() => openUsersDialog(workspace)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-xl hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
              >
                <UsersIcon />
                Users
              </button>
              <button
                onClick={() => openEditDialog(workspace)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl dark:text-slate-400 dark:hover:bg-slate-700"
                title="Edit"
              >
                <EditIcon />
              </button>
              {!workspace.isSystem && (
                <button
                  onClick={() => handleDeleteWorkspace(workspace)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl dark:text-red-400 dark:hover:bg-red-900/30"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No workspaces found. Create your first workspace to get started.</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreateDialog || showEditDialog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              {showCreateDialog ? 'Create Workspace' : 'Edit Workspace'}
            </h2>
            
            <form onSubmit={showCreateDialog ? handleCreateWorkspace : handleUpdateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g., HR Management"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  disabled={showEditDialog}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                  placeholder="e.g., HR"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="employee">Employee</option>
                  <option value="department">Department (HOD)</option>
                  <option value="hr">HR</option>
                  <option value="subadmin">Sub-Admin</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Workspace description..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:from-blue-600 hover:to-indigo-600"
                >
                  {showCreateDialog ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modules Dialog */}
      {showModulesDialog && selectedWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModulesDialog(false)} />
          <div className="relative z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Modules: {selectedWorkspace.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Configure which modules are available in this workspace
            </p>
            
            <div className="space-y-3">
              {modules.map((mod) => {
                const wsModule = selectedWorkspace.modules?.find(m => m.moduleCode === mod.code);
                const isEnabled = wsModule?.isEnabled ?? false;
                
                return (
                  <div
                    key={mod._id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <ModulesIcon />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{mod.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{mod.code} • {mod.category}</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleToggleModule(selectedWorkspace, mod.code, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowModulesDialog(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Dialog */}
      {showUsersDialog && selectedWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowUsersDialog(false)} />
          <div className="relative z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Users: {selectedWorkspace.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Users assigned to this workspace
            </p>
            
            {workspaceUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">No users assigned to this workspace yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workspaceUsers.map((assignment: any) => (
                  <div
                    key={assignment._id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                        {assignment.userId?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {assignment.userId?.employeeId?.first_name} {assignment.userId?.employeeId?.last_name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{assignment.userId?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg dark:bg-slate-700 dark:text-slate-300 capitalize">
                        {assignment.role}
                      </span>
                      {assignment.isPrimary && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowUsersDialog(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

