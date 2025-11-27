const Workspace = require('../model/Workspace');
const RoleAssignment = require('../model/RoleAssignment');

/**
 * Utility functions for workspace assignment
 */

// Mapping of user roles to workspace codes
const ROLE_TO_WORKSPACE_MAP = {
  employee: ['EMP'],           // Employee gets Employee Portal
  hod: ['EMP', 'HOD'],         // HOD gets Employee Portal + HOD Dashboard
  hr: ['EMP', 'HR'],           // HR gets Employee Portal + HR Management
  sub_admin: ['EMP', 'SUBADMIN'], // Sub-admin gets Employee Portal + Administration
  super_admin: [],             // Super Admin doesn't use workspaces (has full access)
};

/**
 * Auto-assign workspaces to a user based on their role(s)
 * @param {string} userId - The user's ID
 * @param {string|string[]} roles - Single role or array of roles
 * @param {string} assignedBy - ID of the user making the assignment
 * @param {Object} options - Additional options
 * @returns {Promise<RoleAssignment[]>} Array of created assignments
 */
exports.autoAssignWorkspaces = async (userId, roles, assignedBy, options = {}) => {
  const { departmentId, scopeConfig } = options;
  
  // Convert single role to array
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  // Get all workspace codes that should be assigned
  const workspaceCodes = new Set();
  roleArray.forEach((role) => {
    const codes = ROLE_TO_WORKSPACE_MAP[role] || [];
    codes.forEach((code) => workspaceCodes.add(code));
  });
  
  if (workspaceCodes.size === 0) {
    console.log(`No workspace mapping for roles: ${roleArray.join(', ')}`);
    return [];
  }
  
  // Find the workspaces
  const workspaces = await Workspace.find({
    code: { $in: Array.from(workspaceCodes) },
    isActive: true,
  });
  
  const assignments = [];
  let isFirstAssignment = true;
  
  for (const workspace of workspaces) {
    // Check if assignment already exists
    const existing = await RoleAssignment.findOne({ userId, workspaceId: workspace._id });
    
    if (existing) {
      // Update existing assignment
      existing.isActive = true;
      if (isFirstAssignment) {
        existing.isPrimary = true;
        isFirstAssignment = false;
      }
      await existing.save();
      assignments.push(existing);
    } else {
      // Create new assignment
      const assignment = await RoleAssignment.create({
        userId,
        workspaceId: workspace._id,
        role: 'member',
        isPrimary: isFirstAssignment,
        assignedBy,
        scopeConfig: workspace.type === 'department' && departmentId
          ? { departments: [departmentId], allDepartments: false }
          : scopeConfig || { allDepartments: workspace.type === 'hr' || workspace.type === 'subadmin' },
      });
      
      assignments.push(assignment);
      isFirstAssignment = false;
    }
  }
  
  // Mark EMP as primary if it exists, otherwise first one
  const empAssignment = assignments.find(
    (a) => a.workspaceId.toString() === workspaces.find((w) => w.code === 'EMP')?._id?.toString()
  );
  
  if (empAssignment) {
    await RoleAssignment.updateMany(
      { userId, _id: { $ne: empAssignment._id } },
      { isPrimary: false }
    );
    empAssignment.isPrimary = true;
    await empAssignment.save();
  }
  
  return assignments;
};

/**
 * Remove all workspace assignments for a user
 * @param {string} userId - The user's ID
 * @param {boolean} hardDelete - If true, delete records; if false, just mark inactive
 */
exports.removeAllWorkspaces = async (userId, hardDelete = false) => {
  if (hardDelete) {
    await RoleAssignment.deleteMany({ userId });
  } else {
    await RoleAssignment.updateMany({ userId }, { isActive: false });
  }
};

/**
 * Update workspace assignments when user roles change
 * @param {string} userId - The user's ID
 * @param {string[]} newRoles - New roles for the user
 * @param {string} assignedBy - ID of the user making the change
 */
exports.syncWorkspacesWithRoles = async (userId, newRoles, assignedBy) => {
  // Get current assignments
  const currentAssignments = await RoleAssignment.find({ userId, isActive: true });
  const currentWorkspaceIds = currentAssignments.map((a) => a.workspaceId.toString());
  
  // Determine which workspaces should be assigned
  const workspaceCodes = new Set();
  newRoles.forEach((role) => {
    const codes = ROLE_TO_WORKSPACE_MAP[role] || [];
    codes.forEach((code) => workspaceCodes.add(code));
  });
  
  const targetWorkspaces = await Workspace.find({
    code: { $in: Array.from(workspaceCodes) },
    isActive: true,
  });
  const targetWorkspaceIds = targetWorkspaces.map((w) => w._id.toString());
  
  // Deactivate workspaces that are no longer needed
  for (const assignment of currentAssignments) {
    if (!targetWorkspaceIds.includes(assignment.workspaceId.toString())) {
      assignment.isActive = false;
      await assignment.save();
    }
  }
  
  // Add new workspaces
  for (const workspace of targetWorkspaces) {
    if (!currentWorkspaceIds.includes(workspace._id.toString())) {
      await RoleAssignment.create({
        userId,
        workspaceId: workspace._id,
        role: 'member',
        isPrimary: false,
        assignedBy,
      });
    }
  }
  
  // Ensure at least one is primary
  const activeAssignments = await RoleAssignment.find({ userId, isActive: true });
  const hasPrimary = activeAssignments.some((a) => a.isPrimary);
  
  if (!hasPrimary && activeAssignments.length > 0) {
    activeAssignments[0].isPrimary = true;
    await activeAssignments[0].save();
  }
};

/**
 * Assign specific workspace to a user
 * @param {string} userId - The user's ID
 * @param {string} workspaceId - The workspace ID to assign
 * @param {Object} options - Assignment options
 */
exports.assignWorkspace = async (userId, workspaceId, options = {}) => {
  const { role = 'member', isPrimary = false, scopeConfig, assignedBy } = options;
  
  let assignment = await RoleAssignment.findOne({ userId, workspaceId });
  
  if (assignment) {
    assignment.isActive = true;
    assignment.role = role;
    if (scopeConfig) assignment.scopeConfig = scopeConfig;
    if (assignedBy) assignment.assignedBy = assignedBy;
  } else {
    assignment = new RoleAssignment({
      userId,
      workspaceId,
      role,
      isPrimary,
      scopeConfig,
      assignedBy,
    });
  }
  
  if (isPrimary) {
    await RoleAssignment.updateMany(
      { userId, _id: { $ne: assignment._id } },
      { isPrimary: false }
    );
    assignment.isPrimary = true;
  }
  
  await assignment.save();
  return assignment;
};

/**
 * Get workspace codes for a set of roles
 */
exports.getWorkspaceCodesForRoles = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const workspaceCodes = new Set();
  
  roleArray.forEach((role) => {
    const codes = ROLE_TO_WORKSPACE_MAP[role] || [];
    codes.forEach((code) => workspaceCodes.add(code));
  });
  
  return Array.from(workspaceCodes);
};

exports.ROLE_TO_WORKSPACE_MAP = ROLE_TO_WORKSPACE_MAP;

