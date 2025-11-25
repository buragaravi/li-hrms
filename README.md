# HRMS & Attendance Management System

## 📋 Project Overview

A comprehensive **Human Resource Management System (HRMS)** that integrates **Attendance Tracking**, **User Management**, and **Payroll Processing** into a unified platform. The system manages biometric-based attendance, automatic shift detection, leave/permission workflows, overtime and on-duty approvals with multi-level hierarchy. It includes a robust User & Department Management module with configurable HR rules and a fully automated Payroll Engine.

### Key Features
- ✅ **Full Automation** - Automated attendance tracking, shift detection, and payroll processing
- ✅ **Transparent Workflow** - Multi-level approval system with clear audit trails
- ✅ **Real-time Sync** - Attendance and payroll data synchronized in real-time
- ✅ **Role Hierarchy Control** - Complete role-based access control (RBAC)
- ✅ **Multi-shift & Multi-department** - Optimized for complex organizational structures
- ✅ **Highly Configurable** - Department-level HR rules and policies
- ✅ **Scalable Architecture** - Built for expansion and growth

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 15+ (React, TypeScript, Tailwind CSS)
- **Backend**: Node.js (Express.js)
- **Database**: MongoDB / PostgreSQL (TBD)
- **Authentication**: JWT-based authentication
- **Biometric Integration**: API-based integration with biometric devices

---

## 📦 Module Structure

### 1️⃣ **Attendance Management Module** (Core Module)

#### Sub-modules:
1. **Shift Management**
   - Shift creation and configuration
   - Shift assignment to employees
   - Automatic shift detection based on attendance logs
   - Confused shift detection and conflict resolution

2. **Biometric Integration**
   - Biometric device API integration
   - Attendance log capture and processing
   - Real-time attendance data sync

3. **Attendance Tracking**
   - Grace-time handling and configuration
   - Late-in tracking and reporting
   - Early-out tracking and reporting
   - Attendance status calculation

4. **Conflict Resolution**
   - Confused shift detection algorithm
   - HR/HOD conflict resolution workflow
   - Manual override capabilities

---

### 2️⃣ **Leave & Workflow Management Module**

#### Sub-modules:
1. **Leave Management**
   - Leave type management (Casual/Sick/Paid/Unpaid)
   - Leave balance tracking
   - Leave application and approval workflow
   - Leave history and reports

2. **Permission Module**
   - Short-duration permission requests
   - Permission approval workflow
   - Permission limit enforcement (department-level)

3. **On-Duty Workflow**
   - On-duty request creation
   - On-duty approval workflow
   - On-duty tracking and reporting

4. **Overtime Management**
   - Overtime request workflow
   - Automatic overtime detection
   - Overtime approval process
   - Overtime calculation and payment

5. **Multi-Level Approval System**
   - Approval hierarchy: Employee → HOD → HR → Super Admin
   - Approval routing logic
   - Approval notifications and reminders
   - Approval history and audit trail

---

### 3️⃣ **User Management Module**

#### Sub-modules:
1. **User Management**
   - User creation for all roles (Super Admin, Sub Admin, HR, HOD, Employee)
   - User profile management
   - User activation/deactivation
   - Bulk user import/export

2. **Role-Based Access Control (RBAC)**
   - Role creation and configuration
   - Permission assignment (Read/Write)
   - Multi-role assignment support
   - Role hierarchy management

3. **Department Management**
   - Department creation and configuration
   - Department hierarchy
   - Department assignment to users
   - Department-level settings

4. **HR Rules Configuration**
   - Late-in limit configuration
   - Early-out rules setup
   - Permission limits per department
   - Auto deduction rules (e.g., 3 late-ins → ½ day deduction)
   - Grace-time configuration

---

### 4️⃣ **Payroll Management Module**

#### Sub-modules:
1. **Salary Configuration**
   - Employee salary setup
   - Salary structure definition
   - Allowances configuration (department/employee-specific)
   - Deductions configuration

2. **Attendance Data Integration**
   - Attendance data gathering
   - Salary formula application
   - Attendance-based deductions calculation

3. **Overtime Payment**
   - Overtime hours calculation
   - Overtime rate configuration
   - Overtime payment calculation

4. **Loan & Advance Management**
   - Loan application workflow
   - Salary advance request workflow
   - EMI auto deduction setup
   - Advance recovery system
   - Loan/advance history tracking

5. **Payroll Processing**
   - Fully automated monthly salary processing
   - Gross salary calculation
   - Net salary calculation
   - Payroll generation and approval
   - Payslip generation

6. **Transaction & History**
   - Transaction logging
   - Payroll history maintenance
   - Financial reports generation
   - Audit trail for all transactions

---

## 🚀 Development Sprints

### **Sprint 0: Foundation & Setup** (Week 1)
- [ ] Project setup and repository initialization
- [ ] Database schema design and setup
- [ ] Authentication module basic structure
- [ ] API structure and routing setup
- [ ] Frontend project initialization
- [ ] Development environment configuration

---

### **Sprint 1: Authentication & User Management Foundation** (Week 2-3)

#### Backend Tasks:
- [ ] User model and schema design
- [ ] Authentication API (Login, JWT token generation)
- [ ] User CRUD operations
- [ ] Role model and schema
- [ ] Permission system design
- [ ] Password encryption and security

#### Frontend Tasks:
- [ ] Login page implementation
- [ ] Dashboard layout structure
- [ ] User management UI (basic)
- [ ] Route protection and authentication guards

**Deliverables:**
- ✅ Working login system
- ✅ Basic user management interface
- ✅ JWT-based authentication

---

### **Sprint 2: Department & Role Management** (Week 4-5)

#### Backend Tasks:
- [ ] Department model and CRUD APIs
- [ ] Role management APIs
- [ ] Permission assignment APIs
- [ ] Multi-role assignment logic
- [ ] Department hierarchy implementation

#### Frontend Tasks:
- [ ] Department management UI
- [ ] Role management interface
- [ ] Permission assignment UI
- [ ] User-role assignment interface

**Deliverables:**
- ✅ Complete department management
- ✅ Role-based access control system
- ✅ User-role assignment functionality

---

### **Sprint 3: Shift Management** (Week 6-7)

#### Backend Tasks:
- [ ] Shift model and schema
- [ ] Shift CRUD APIs
- [ ] Shift assignment to employees
- [ ] Shift configuration (timings, grace-time)
- [ ] Shift validation logic

#### Frontend Tasks:
- [ ] Shift creation and management UI
- [ ] Shift assignment interface
- [ ] Shift configuration forms
- [ ] Shift list and calendar view

**Deliverables:**
- ✅ Complete shift management system
- ✅ Shift assignment functionality
- ✅ Shift configuration interface

---

### **Sprint 4: Biometric Integration & Attendance Logging** (Week 8-9)

#### Backend Tasks:
- [ ] Biometric API integration layer
- [ ] Attendance log model and schema
- [ ] Attendance log capture and processing
- [ ] Real-time attendance sync
- [ ] Attendance log validation

#### Frontend Tasks:
- [ ] Attendance log display interface
- [ ] Real-time attendance dashboard
- [ ] Attendance log filtering and search
- [ ] Biometric device status monitoring

**Deliverables:**
- ✅ Biometric device integration
- ✅ Attendance log capture system
- ✅ Real-time attendance dashboard

---

### **Sprint 5: Automatic Shift Detection & Attendance Calculation** (Week 10-11)

#### Backend Tasks:
- [ ] Automatic shift detection algorithm
- [ ] Attendance status calculation (Present/Absent/Late/Early-out)
- [ ] Grace-time handling logic
- [ ] Late-in detection and tracking
- [ ] Early-out detection and tracking
- [ ] Confused shift detection algorithm

#### Frontend Tasks:
- [ ] Attendance status display
- [ ] Attendance calendar view
- [ ] Late-in/Early-out reports
- [ ] Shift detection status indicators

**Deliverables:**
- ✅ Automatic shift detection system
- ✅ Attendance calculation engine
- ✅ Late-in/Early-out tracking

---

### **Sprint 6: Conflict Resolution & HR Rules** (Week 12-13)

#### Backend Tasks:
- [ ] Confused shift detection logic
- [ ] Conflict resolution workflow
- [ ] HR rules configuration APIs
- [ ] Auto deduction rule engine
- [ ] Department-level rule application

#### Frontend Tasks:
- [ ] Conflict resolution interface
- [ ] HR rules configuration UI
- [ ] Auto deduction setup forms
- [ ] Conflict resolution dashboard

**Deliverables:**
- ✅ Conflict resolution system
- ✅ HR rules configuration
- ✅ Auto deduction functionality

---

### **Sprint 7: Leave Management** (Week 14-15)

#### Backend Tasks:
- [ ] Leave type model and APIs
- [ ] Leave balance tracking
- [ ] Leave application workflow
- [ ] Leave approval APIs
- [ ] Leave history and reports

#### Frontend Tasks:
- [ ] Leave application form
- [ ] Leave balance display
- [ ] Leave approval interface
- [ ] Leave calendar and reports

**Deliverables:**
- ✅ Complete leave management system
- ✅ Leave application and approval workflow
- ✅ Leave balance tracking

---

### **Sprint 8: Permission & On-Duty Management** (Week 16-17)

#### Backend Tasks:
- [ ] Permission request model and APIs
- [ ] Permission approval workflow
- [ ] Permission limit enforcement
- [ ] On-duty request model and APIs
- [ ] On-duty approval workflow

#### Frontend Tasks:
- [ ] Permission request form
- [ ] Permission approval interface
- [ ] On-duty request form
- [ ] On-duty approval interface

**Deliverables:**
- ✅ Permission management system
- ✅ On-duty management system
- ✅ Approval workflows

---

### **Sprint 9: Overtime Management** (Week 18-19)

#### Backend Tasks:
- [ ] Overtime request model and APIs
- [ ] Automatic overtime detection logic
- [ ] Overtime approval workflow
- [ ] Overtime calculation engine
- [ ] Overtime rate configuration

#### Frontend Tasks:
- [ ] Overtime request form
- [ ] Overtime approval interface
- [ ] Overtime calculation display
- [ ] Overtime reports

**Deliverables:**
- ✅ Overtime management system
- ✅ Automatic overtime detection
- ✅ Overtime calculation engine

---

### **Sprint 10: Multi-Level Approval System** (Week 20-21)

#### Backend Tasks:
- [ ] Approval workflow engine
- [ ] Approval routing logic (Employee → HOD → HR → Super Admin)
- [ ] Approval notification system
- [ ] Approval history tracking
- [ ] Approval reminder system

#### Frontend Tasks:
- [ ] Approval dashboard
- [ ] Approval action interface
- [ ] Approval history view
- [ ] Notification system UI

**Deliverables:**
- ✅ Complete multi-level approval system
- ✅ Approval routing and notifications
- ✅ Approval history and audit trail

---

### **Sprint 11: Payroll Configuration** (Week 22-23)

#### Backend Tasks:
- [ ] Salary structure model
- [ ] Allowances configuration APIs
- [ ] Deductions configuration APIs
- [ ] Employee salary setup APIs
- [ ] Salary formula engine design

#### Frontend Tasks:
- [ ] Salary configuration interface
- [ ] Allowances setup forms
- [ ] Deductions setup forms
- [ ] Salary structure management UI

**Deliverables:**
- ✅ Payroll configuration system
- ✅ Salary structure management
- ✅ Allowances and deductions setup

---

### **Sprint 12: Loan & Advance Management** (Week 24-25)

#### Backend Tasks:
- [ ] Loan model and APIs
- [ ] Salary advance model and APIs
- [ ] Loan application workflow
- [ ] Advance request workflow
- [ ] EMI calculation engine
- [ ] Advance recovery system

#### Frontend Tasks:
- [ ] Loan application form
- [ ] Advance request form
- [ ] Loan/advance list interface
- [ ] EMI schedule display

**Deliverables:**
- ✅ Loan management system
- ✅ Salary advance system
- ✅ EMI auto deduction

---

### **Sprint 13: Automated Payroll Processing** (Week 26-27)

#### Backend Tasks:
- [ ] Attendance data gathering for payroll
- [ ] Salary formula implementation
- [ ] Gross salary calculation
- [ ] Net salary calculation
- [ ] Automated payroll processing job
- [ ] Payroll generation APIs

#### Frontend Tasks:
- [ ] Payroll processing dashboard
- [ ] Payroll generation interface
- [ ] Payroll preview and review
- [ ] Payroll approval interface

**Deliverables:**
- ✅ Fully automated payroll processing
- ✅ Gross and net salary calculation
- ✅ Payroll generation system

---

### **Sprint 14: Payslip & Transaction Management** (Week 28-29)

#### Backend Tasks:
- [ ] Payslip generation engine
- [ ] Transaction logging system
- [ ] Payroll history APIs
- [ ] Financial reports generation
- [ ] Audit trail implementation

#### Frontend Tasks:
- [ ] Payslip generation and display
- [ ] Transaction history interface
- [ ] Payroll history view
- [ ] Financial reports dashboard

**Deliverables:**
- ✅ Payslip generation system
- ✅ Transaction logging and history
- ✅ Financial reports

---

### **Sprint 15: Reports & Analytics** (Week 30-31)

#### Backend Tasks:
- [ ] Attendance reports APIs
- [ ] Leave reports APIs
- [ ] Payroll reports APIs
- [ ] Analytics and insights APIs
- [ ] Export functionality (PDF/Excel)

#### Frontend Tasks:
- [ ] Reports dashboard
- [ ] Attendance reports UI
- [ ] Leave reports UI
- [ ] Payroll reports UI
- [ ] Analytics and insights visualization

**Deliverables:**
- ✅ Comprehensive reporting system
- ✅ Analytics and insights
- ✅ Export functionality

---

### **Sprint 16: Testing & Bug Fixes** (Week 32-33)

#### Tasks:
- [ ] Unit testing for all modules
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Bug fixes and optimizations

**Deliverables:**
- ✅ Test coverage reports
- ✅ Bug-free system
- ✅ Performance optimizations

---

### **Sprint 17: Documentation & Deployment** (Week 34-35)

#### Tasks:
- [ ] API documentation
- [ ] User manual
- [ ] Admin guide
- [ ] Deployment setup
- [ ] Production environment configuration
- [ ] Monitoring and logging setup

**Deliverables:**
- ✅ Complete documentation
- ✅ Production-ready deployment
- ✅ Monitoring and logging

---

## 📊 Sprint Summary

| Sprint | Module Focus | Duration | Key Deliverables |
|--------|-------------|----------|-----------------|
| 0 | Foundation | 1 week | Project setup, DB schema |
| 1 | Authentication | 2 weeks | Login system, User management |
| 2 | Department & Roles | 2 weeks | RBAC, Department management |
| 3 | Shift Management | 2 weeks | Shift CRUD, Assignment |
| 4 | Biometric Integration | 2 weeks | Device integration, Log capture |
| 5 | Attendance Calculation | 2 weeks | Auto detection, Status calculation |
| 6 | Conflict Resolution | 2 weeks | HR rules, Auto deduction |
| 7 | Leave Management | 2 weeks | Leave workflow, Balance tracking |
| 8 | Permission & On-Duty | 2 weeks | Permission/On-duty workflows |
| 9 | Overtime | 2 weeks | Overtime detection, Calculation |
| 10 | Approval System | 2 weeks | Multi-level approvals |
| 11 | Payroll Config | 2 weeks | Salary structure, Allowances |
| 12 | Loan & Advance | 2 weeks | Loan/Advance workflows, EMI |
| 13 | Payroll Processing | 2 weeks | Automated processing, Calculation |
| 14 | Payslip & Transactions | 2 weeks | Payslip generation, History |
| 15 | Reports & Analytics | 2 weeks | Reports, Analytics, Export |
| 16 | Testing | 2 weeks | Testing, Bug fixes |
| 17 | Documentation | 2 weeks | Docs, Deployment |

**Total Duration: 35 weeks (~8.75 months)**

---

## 🔐 Role Hierarchy

```
Super Admin
    ↓
Sub Admin
    ↓
HR Manager
    ↓
HOD (Head of Department)
    ↓
Employee
```

### Role Permissions Matrix

| Feature | Super Admin | Sub Admin | HR | HOD | Employee |
|---------|------------|-----------|----|----|----------|
| User Management | ✅ Full | ✅ Full | ✅ Read | ❌ | ❌ |
| Department Management | ✅ Full | ✅ Full | ✅ Read | ❌ | ❌ |
| Shift Management | ✅ Full | ✅ Full | ✅ Full | ✅ Read | ❌ |
| Attendance View | ✅ Full | ✅ Full | ✅ Full | ✅ Own Dept | ✅ Own |
| Leave Approval | ✅ Full | ✅ Full | ✅ Full | ✅ Own Dept | ❌ |
| Permission Approval | ✅ Full | ✅ Full | ✅ Full | ✅ Own Dept | ❌ |
| Overtime Approval | ✅ Full | ✅ Full | ✅ Full | ✅ Own Dept | ❌ |
| Payroll Management | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| Reports | ✅ Full | ✅ Full | ✅ Full | ✅ Own Dept | ✅ Own |

---

## 🎯 Key Workflows

### 1. Attendance Workflow
```
Biometric Device → Attendance Log → Auto Shift Detection → 
Status Calculation → Late/Early Detection → Apply HR Rules → 
Update Attendance Record
```

### 2. Leave Application Workflow
```
Employee Request → HOD Approval → HR Approval → 
Super Admin Approval (if needed) → Update Leave Balance → 
Notification
```

### 3. Payroll Processing Workflow
```
Monthly Trigger → Gather Attendance Data → Calculate Overtime → 
Apply Allowances → Apply Deductions → Calculate Loans/Advances → 
Generate Gross Salary → Calculate Net Salary → Generate Payslip → 
Approval → Transaction Logging
```

---

## 📝 Notes

- All modules follow the modular folder structure with `controllers`, `models`, and `index.js` for routes
- Each module is independent but integrated through the main server.js
- Real-time synchronization ensures data consistency across modules
- All workflows include audit trails for compliance
- System is designed to handle high volume of concurrent users
- Biometric integration supports multiple device vendors through API abstraction

---

## 🚦 Development Status

- [x] Project Setup
- [x] Backend Server Structure
- [x] Frontend Setup (Next.js)
- [ ] Authentication Module
- [ ] User Management Module
- [ ] Attendance Management Module
- [ ] Leave & Workflow Module
- [ ] Payroll Management Module
- [ ] Reports & Analytics

---

## 📞 Contact & Support

For questions or support regarding this HRMS system, please contact the development team.

---

**Last Updated:** 2024
**Version:** 1.0.0

