# Multi-Workspace User Management System Architecture

## 📋 Overview

This document describes the architecture for implementing a dynamic, role-based workspace system in the HRMS application. The system allows a single user to have multiple roles and switch between different workspaces, each with its own set of modules, permissions, and data scope.

---

## 🎯 Core Concepts

### What is a Workspace?

A **Workspace** is an isolated environment that defines:
- **Which modules** are available (Leave, Attendance, Reports, etc.)
- **What permissions** exist for each module (view, create, edit, approve, etc.)
- **What data scope** is visible (own data, department data, all data)
- **What actions** can be performed at each level

### User → Employee → Workspace Relationship

```
┌─────────────────────────────────────────────────────────────────────┐
│                           EMPLOYEE                                   │
│  (Master Data: Name, Emp No, Department, Designation, etc.)         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ employeeId
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                             USER                                     │
│  (Auth: Email, Password, isActive, lastLogin)                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ userId
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROLE ASSIGNMENTS                                │
│  (userId, workspaceId, role, permissions, deptScope, isActive)      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ workspaceId
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          WORKSPACE                                   │
│  (name, type, modules[], defaultPermissions, settings)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Data Models

### 1. Workspace Model

```javascript
const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },           // "Employee Portal", "HOD Dashboard", "HR Management"
  code: { type: String, required: true, unique: true }, // "EMP", "HOD", "HR", "SUBADMIN"
  type: { 
    type: String, 
    enum: ['employee', 'department', 'hr', 'subadmin', 'superadmin'],
    required: true 
  },
  description: String,
  
  // Modules assigned to this workspace
  modules: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    moduleCode: String,  // "LEAVE", "ATTENDANCE", "REPORTS"
    
    // Permissions for this module in this workspace
    permissions: {
      canView: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canApprove: { type: Boolean, default: false },
      canForward: { type: Boolean, default: false },
      canExport: { type: Boolean, default: false },
    },
    
    // Data scope for this module
    dataScope: {
      type: String,
      enum: ['own', 'department', 'assigned_departments', 'all'],
      default: 'own'
    },
    
    // Custom settings for this module in this workspace
    settings: {
      editableStatuses: [String],      // ["pending", "draft"] - can only edit when status is one of these
      visibleColumns: [String],         // Which columns to show in lists
      allowedActions: [String],         // ["apply", "cancel", "track"]
      customFilters: mongoose.Schema.Types.Mixed,
    }
  }],
  
  // Default landing page/module
  defaultModule: String,
  
  // UI customization
  theme: {
    primaryColor: String,
    icon: String,
    layout: String,
  },
  
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false },  // System workspaces can't be deleted
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

### 2. Module Model (Master List of All Modules)

```javascript
const ModuleSchema = new mongoose.Schema({
  name: { type: String, required: true },           // "Leave Management"
  code: { type: String, required: true, unique: true }, // "LEAVE"
  description: String,
  icon: String,
  route: String,                                     // "/leaves"
  
  // All possible permissions for this module
  availablePermissions: [{
    key: String,        // "canApprove"
    label: String,      // "Can Approve Leaves"
    description: String,
  }],
  
  // All possible data scopes
  availableScopes: [{
    key: String,        // "department"
    label: String,      // "Department Level"
    description: String,
  }],
  
  // Default settings schema
  settingsSchema: mongoose.Schema.Types.Mixed,
  
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});
```

### 3. Role Assignment Model (User ↔ Workspace Mapping)

```javascript
const RoleAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  
  // Role within this workspace
  role: { 
    type: String, 
    enum: ['member', 'manager', 'admin'],
    default: 'member'
  },
  
  // Override workspace-level permissions (optional)
  permissionOverrides: [{
    moduleCode: String,
    permissions: mongoose.Schema.Types.Mixed,
  }],
  
  // Scope restrictions (for department-based workspaces)
  scopeConfig: {
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    designations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Designation' }],
    // Additional scope filters as needed
  },
  
  isActive: { type: Boolean, default: true },
  isPrimary: { type: Boolean, default: false },  // Default workspace on login
  
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date, default: Date.now },
  expiresAt: Date,  // Optional expiry for temporary assignments
});

// Compound index to ensure unique user-workspace pairs
RoleAssignmentSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });
```

### 4. Updated User Model

```javascript
const UserSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Current active workspace (updated on workspace switch)
  activeWorkspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  
  // Legacy role field (keep for backward compatibility, but use RoleAssignments)
  role: { type: String, enum: ['super_admin', 'user'], default: 'user' },
  
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
  // Preferences
  preferences: {
    defaultWorkspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    language: { type: String, default: 'en' },
    timezone: String,
  },
});
```

---

## 🔄 Workspace Flow

### Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Validate credentials                                         │
│  2. Fetch all RoleAssignments for this user                     │
│  3. Populate workspace details for each assignment              │
│  4. Set activeWorkspaceId to primary or first workspace         │
│  5. Return token + user + workspaces + activeWorkspace          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend stores:                                                │
│  - token                                                         │
│  - user info                                                     │
│  - workspaces[] (all available)                                 │
│  - activeWorkspace (current)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Workspace Switch Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks workspace dropdown → selects "HOD Dashboard"        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend:                                                       │
│  1. Call POST /api/users/switch-workspace { workspaceId }       │
│  2. Backend validates user has access to this workspace         │
│  3. Backend updates user.activeWorkspaceId                      │
│  4. Backend returns updated workspace details + permissions     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend:                                                       │
│  1. Update activeWorkspace in state/context                     │
│  2. Update sidebar menu based on workspace.modules              │
│  3. Redirect to workspace default route                         │
│  4. All subsequent API calls include activeWorkspaceId          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Example Workspace Configurations

### 1. Employee Workspace

```javascript
{
  name: "Employee Portal",
  code: "EMP",
  type: "employee",
  modules: [
    {
      moduleCode: "LEAVE",
      permissions: {
        canView: true,      // Can view own leaves
        canCreate: true,    // Can apply leave
        canEdit: true,      // Can edit (controlled by settings)
        canDelete: false,   // Cannot delete
        canApprove: false,  // Cannot approve
      },
      dataScope: "own",     // Only see own data
      settings: {
        editableStatuses: ["draft", "pending"],  // Can only edit when draft or pending
        allowedActions: ["apply", "cancel", "track"],
        visibleColumns: ["date", "type", "status", "reason"],
      }
    },
    {
      moduleCode: "ATTENDANCE",
      permissions: {
        canView: true,
        canCreate: false,
        canEdit: false,
      },
      dataScope: "own",
      settings: {
        allowedActions: ["view", "download_report"],
      }
    },
    {
      moduleCode: "PROFILE",
      permissions: {
        canView: true,
        canEdit: true,  // Limited fields
      },
      settings: {
        editableFields: ["phone", "emergency_contact", "address"],
      }
    }
  ],
  defaultModule: "LEAVE",
}
```

### 2. HOD/Department Workspace

```javascript
{
  name: "Department Management",
  code: "HOD",
  type: "department",
  modules: [
    {
      moduleCode: "LEAVE",
      permissions: {
        canView: true,
        canCreate: true,     // Can apply own leave too
        canEdit: false,
        canDelete: false,
        canApprove: false,   // HOD forwards, doesn't final approve
        canForward: true,    // Can forward to HR
      },
      dataScope: "department",  // See all department leaves
      settings: {
        editableStatuses: [],
        allowedActions: ["view", "forward", "reject", "comment"],
        visibleColumns: ["employee", "date", "type", "status", "reason", "actions"],
        workflowActions: {
          pending: ["forward", "reject", "request_info"],
          forwarded: ["view"],
        }
      }
    },
    {
      moduleCode: "ATTENDANCE",
      permissions: {
        canView: true,
        canEdit: true,       // Can correct attendance
        canExport: true,
      },
      dataScope: "department",
      settings: {
        allowedActions: ["view", "correct", "export"],
      }
    },
    {
      moduleCode: "TEAM",
      permissions: {
        canView: true,
      },
      dataScope: "department",
    }
  ],
  defaultModule: "LEAVE",
}
```

### 3. HR Workspace

```javascript
{
  name: "HR Management",
  code: "HR",
  type: "hr",
  modules: [
    {
      moduleCode: "LEAVE",
      permissions: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,    // Final approval
        canForward: false,
        canExport: true,
      },
      dataScope: "all",      // OR "assigned_departments" based on HR's scope
      settings: {
        editableStatuses: ["forwarded", "pending"],
        allowedActions: ["view", "approve", "reject", "edit", "export"],
        workflowActions: {
          forwarded: ["approve", "reject", "request_info"],
          pending: ["approve", "reject", "forward_to_hod"],
        }
      }
    },
    {
      moduleCode: "ATTENDANCE",
      permissions: {
        canView: true,
        canEdit: true,
        canCreate: true,
        canExport: true,
      },
      dataScope: "all",
    },
    {
      moduleCode: "EMPLOYEES",
      permissions: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
      },
      dataScope: "all",
    },
    {
      moduleCode: "REPORTS",
      permissions: {
        canView: true,
        canExport: true,
      },
      dataScope: "all",
    }
  ],
  defaultModule: "LEAVE",
}
```

### 4. Sub-Admin Workspace

```javascript
{
  name: "Administration",
  code: "SUBADMIN",
  type: "subadmin",
  modules: [
    {
      moduleCode: "LEAVE",
      permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
      dataScope: "all",
    },
    {
      moduleCode: "ATTENDANCE",
      permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
      dataScope: "all",
    },
    {
      moduleCode: "EMPLOYEES",
      permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      dataScope: "all",
    },
    {
      moduleCode: "DEPARTMENTS",
      permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      dataScope: "all",
    },
    {
      moduleCode: "SHIFTS",
      permissions: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      dataScope: "all",
    },
    {
      moduleCode: "USERS",
      permissions: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      dataScope: "all",
    },
    {
      moduleCode: "REPORTS",
      permissions: { canView: true, canExport: true },
      dataScope: "all",
    },
  ],
  defaultModule: "EMPLOYEES",
}
```

---

## 🔐 Permission & Data Scope Resolution

### How Permissions Are Resolved

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Get user's active workspace                                  │
│  2. Get workspace's module configuration                         │
│  3. Get user's role assignment for this workspace               │
│  4. Check for permission overrides in role assignment           │
│  5. Final permission = workspace.module.permissions              │
│                        + roleAssignment.permissionOverrides      │
└─────────────────────────────────────────────────────────────────┘
```

### How Data Scope Is Applied

```javascript
// Middleware: applyDataScope.js

const applyDataScope = async (req, res, next) => {
  const { activeWorkspace, roleAssignment } = req;
  const moduleCode = req.moduleCode; // Set by route
  
  const moduleConfig = activeWorkspace.modules.find(m => m.moduleCode === moduleCode);
  const dataScope = moduleConfig?.dataScope || 'own';
  
  // Build query filter based on scope
  switch (dataScope) {
    case 'own':
      req.scopeFilter = { employeeId: req.user.employeeId };
      break;
      
    case 'department':
      const userDept = req.user.employee.department;
      req.scopeFilter = { department: userDept };
      break;
      
    case 'assigned_departments':
      const assignedDepts = roleAssignment.scopeConfig?.departments || [];
      req.scopeFilter = { department: { $in: assignedDepts } };
      break;
      
    case 'all':
      req.scopeFilter = {}; // No restriction
      break;
  }
  
  next();
};
```

---

## 🖥️ Frontend Architecture

### Workspace Context

```typescript
// contexts/WorkspaceContext.tsx

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  permissions: ModulePermissions;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  hasPermission: (moduleCode: string, permission: string) => boolean;
  getModuleConfig: (moduleCode: string) => ModuleConfig | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  
  // Load workspaces on auth
  useEffect(() => {
    const loadWorkspaces = async () => {
      const response = await api.getUserWorkspaces();
      setWorkspaces(response.workspaces);
      setActiveWorkspace(response.activeWorkspace);
    };
    loadWorkspaces();
  }, []);
  
  const switchWorkspace = async (workspaceId: string) => {
    const response = await api.switchWorkspace(workspaceId);
    setActiveWorkspace(response.workspace);
    // Redirect to workspace default module
    router.push(`/workspace/${workspaceId}/${response.workspace.defaultModule.toLowerCase()}`);
  };
  
  const hasPermission = (moduleCode: string, permission: string) => {
    const module = activeWorkspace?.modules.find(m => m.moduleCode === moduleCode);
    return module?.permissions?.[permission] || false;
  };
  
  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      switchWorkspace,
      hasPermission,
      // ...
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
```

### Workspace Dropdown Component

```tsx
// components/WorkspaceDropdown.tsx

const WorkspaceDropdown = () => {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <span className="font-medium">{activeWorkspace?.name}</span>
        <ChevronDownIcon />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-lg">
          {workspaces.map(workspace => (
            <button
              key={workspace._id}
              onClick={() => {
                switchWorkspace(workspace._id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                workspace._id === activeWorkspace?._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium">{workspace.name}</div>
              <div className="text-sm text-slate-500">{workspace.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Dynamic Sidebar Based on Workspace

```tsx
// components/Sidebar.tsx

const Sidebar = () => {
  const { activeWorkspace, hasPermission } = useWorkspace();
  
  // Filter modules based on permissions
  const availableModules = activeWorkspace?.modules.filter(module => 
    hasPermission(module.moduleCode, 'canView')
  ) || [];
  
  return (
    <nav>
      {availableModules.map(module => (
        <NavItem
          key={module.moduleCode}
          href={`/workspace/${activeWorkspace._id}/${module.moduleCode.toLowerCase()}`}
          icon={getModuleIcon(module.moduleCode)}
          label={module.name}
        />
      ))}
    </nav>
  );
};
```

---

## 🛠️ Super Admin: Workspace Configuration UI

The Super Admin dashboard will have a dedicated section to:

### 1. Manage Workspaces

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKSPACES                                          [+ Create] │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Employee Portal          Type: employee      [Edit] [Del]│  │
│  │ 3 modules assigned                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ HOD Dashboard            Type: department    [Edit] [Del]│  │
│  │ 4 modules assigned                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ HR Management            Type: hr            [Edit] [Del]│  │
│  │ 6 modules assigned                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Configure Workspace Modules

```
┌─────────────────────────────────────────────────────────────────┐
│  EDIT WORKSPACE: Employee Portal                                │
├─────────────────────────────────────────────────────────────────┤
│  Name: [Employee Portal        ]                                │
│  Type: [employee ▼]                                             │
│  Default Module: [LEAVE ▼]                                      │
├─────────────────────────────────────────────────────────────────┤
│  ASSIGNED MODULES                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ☑ Leave Management                        [Configure →]  │  │
│  │ ☑ Attendance                              [Configure →]  │  │
│  │ ☑ Profile                                 [Configure →]  │  │
│  │ ☐ Reports                                                │  │
│  │ ☐ Team                                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Configure Module Permissions & Settings

```
┌─────────────────────────────────────────────────────────────────┐
│  MODULE CONFIG: Leave Management (Employee Portal)              │
├─────────────────────────────────────────────────────────────────┤
│  PERMISSIONS                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ☑ Can View                                               │  │
│  │ ☑ Can Create (Apply Leave)                               │  │
│  │ ☑ Can Edit                                               │  │
│  │ ☐ Can Delete                                             │  │
│  │ ☐ Can Approve                                            │  │
│  │ ☐ Can Forward                                            │  │
│  │ ☐ Can Export                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  DATA SCOPE                                                     │
│  (•) Own Data Only                                              │
│  ( ) Department Data                                            │
│  ( ) Assigned Departments                                       │
│  ( ) All Data                                                   │
├─────────────────────────────────────────────────────────────────┤
│  MODULE SETTINGS                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Editable Statuses: [draft, pending]                      │  │
│  │ Allowed Actions: [apply, cancel, track]                  │  │
│  │ Hide Edit After Status: [approved, rejected]             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Developer Dashboard - Is It Needed?

### Answer: **Not as a Separate Space**

The "Developer Dashboard" concept you mentioned is essentially what the **Super Admin workspace** already provides. Here's the breakdown:

| Feature | Where It Should Live |
|---------|---------------------|
| Create/Edit Workspaces | Super Admin → Workspaces |
| Configure Modules per Workspace | Super Admin → Workspace Config |
| Set Permissions per Module | Super Admin → Module Config |
| Assign Users to Workspaces | Super Admin → User Management |
| Create Modules | Super Admin → System Settings |
| System Configuration | Super Admin → Settings |

### When You WOULD Need a Separate Developer Space:

1. **Multi-Tenant SaaS**: If you're selling this HRMS to multiple companies, you'd need a "Developer/Platform Admin" space that sits ABOVE company-level super admins.

2. **Plugin System**: If modules can be installed/uninstalled like plugins, a developer space would manage the module registry.

3. **White-Labeling**: If each company can customize branding, themes, etc.

### Recommendation:

For now, **keep everything in Super Admin**. Structure it as:

```
Super Admin Dashboard
├── Dashboard (Overview)
├── Employees
├── Departments
├── Shifts
├── Users & Access
│   ├── Users List
│   ├── Workspaces         ← Workspace CRUD
│   ├── Role Assignments   ← User-Workspace mapping
│   └── Permissions        ← Global permission overview
├── Modules                ← Module master list
│   ├── Leave Management
│   ├── Attendance
│   └── ... etc
├── Settings
│   ├── General
│   ├── Employee Settings
│   ├── Shift Durations
│   └── System Config
└── Reports
```

---

## 📋 Implementation Plan

### Phase 1: Foundation (Backend)
1. Create `Workspace` model
2. Create `Module` model
3. Create `RoleAssignment` model
4. Update `User` model with `activeWorkspaceId`
5. Create workspace middleware for permission checking
6. Create data scope middleware

### Phase 2: Core APIs
1. `GET /api/workspaces` - List all workspaces (admin)
2. `POST /api/workspaces` - Create workspace
3. `PUT /api/workspaces/:id` - Update workspace
4. `GET /api/user/workspaces` - Get user's assigned workspaces
5. `POST /api/user/switch-workspace` - Switch active workspace
6. `GET /api/workspaces/:id/users` - Get users in workspace
7. `POST /api/workspaces/:id/assign` - Assign user to workspace

### Phase 3: Seed Default Workspaces
1. Create "Employee Portal" workspace
2. Create "HOD Dashboard" workspace
3. Create "HR Management" workspace
4. Create "Sub-Admin" workspace
5. Create default modules (Leave, Attendance, etc.)

### Phase 4: Frontend Integration
1. Create WorkspaceContext
2. Update auth flow to load workspaces
3. Create WorkspaceDropdown component
4. Update Sidebar to be workspace-aware
5. Update all pages to check permissions

### Phase 5: Super Admin UI
1. Workspace management page
2. Module configuration page
3. User-workspace assignment UI
4. Permission matrix view

### Phase 6: Module-Specific Integration
1. Update Leave module to respect workspace permissions
2. Update Attendance module
3. Update Employee module
4. ... and so on

---

## ❓ Questions to Clarify

1. **HOD Scope**: Should HOD see only their primary department, or can they be assigned multiple departments?

2. **Leave Workflow**: What's the exact approval chain?
   - Employee → HOD → HR → Approved?
   - Or Employee → HR directly for some leave types?

3. **HR Scope**: Should HR see all employees, or can HR be assigned to specific departments?

4. **Sub-Admin vs Super Admin**: What's the difference in their capabilities?

5. **User Creation**: When creating a user from employee:
   - Auto-assign to Employee workspace?
   - Manual workspace assignment?
   - Both?

6. **Workspace Switching**: Should switching workspace:
   - Just change the view (keep URL)?
   - Change URL to `/workspace/{id}/...`?

---

## 🎯 Summary

This workspace system provides:

✅ **Flexibility**: Any user can have any combination of workspaces  
✅ **Isolation**: Each workspace has its own modules and permissions  
✅ **Scalability**: Easy to add new workspaces and modules  
✅ **Maintainability**: Permissions are centralized and easy to manage  
✅ **Dynamic UI**: Frontend adapts based on workspace configuration  
✅ **Data Security**: Backend enforces data scope at every level  

The key insight is: **Don't think of roles as static permissions. Think of workspaces as isolated environments with their own context, modules, and rules.**

