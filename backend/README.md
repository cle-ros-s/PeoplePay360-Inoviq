# PeoplePay360 — Backend REST API

Production-ready backend for **PeoplePay360**, an integrated Human Resource and Payroll Operations Platform. Built with **Node.js, Express, Prisma ORM, and PostgreSQL**.

---

## 1. Features & Architecture

- **Authentication & RBAC**: JWT (8h expiry) with bcrypt password hashing across 5 distinct roles (`ADMIN`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `EMPLOYEE`).
- **Employee & Master Data Management**: Centralized employee profiles, departmental hierarchies, contracts, and working schedules.
- **Working Schedule Engine**: Server-side weekly hour calculations (`(endTime - startTime - breakMinutes)/60`).
- **Attendance & Exception Tracking**: Check-in, check-out, automated status derivation (`OVERTIME`, `LATE`, `PRESENT`, `MISSING_CHECKOUT`), and audit-trailed manual corrections.
- **Time-Off & Leave Management**: Time-off types, allocations, requests, and approval workflows with atomic balance deduction in database transactions.
- **Salary Structures & Rules**: Modular computation rules (`FIXED`, `PERCENTAGE`, `FORMULA`) with safe expression evaluation (`mathjs.evaluate`, zero `eval()`).
- **4-Stage Payrun Processing Lifecycle**:
  $$\text{Eligible Employees} \longrightarrow \text{Create DRAFT} \longrightarrow \text{Compute Payroll} \longrightarrow \text{Validate} \longrightarrow \text{Mark as PAID}$$
- **Payroll Warning Engine**: Automated detection of critical and non-critical blockers (`MISSING_BANK_DETAILS`, `MISSING_SCHEDULE`, `MISSING_CONTRACT`, `DUPLICATE_PAYSLIP`, `NEGATIVE_NET`).
- **Payslip PDF & Email Distribution**: Streamed PDF rendering with `pdfkit` and single/bulk email delivery with `nodemailer`.
- **Live Aggregated Analytics Dashboard**: Real-time DB metrics for KPIs, department costs, net salary trends, attendance health, and leave metrics.

---

## 2. Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: PostgreSQL (Neon PostgreSQL / Local PostgreSQL 18)
- **ORM**: Prisma Client
- **Authentication**: `jsonwebtoken`, `bcryptjs`
- **Validation**: `zod`
- **Formula Engine**: `mathjs`
- **PDF Generation**: `pdfkit`
- **Email Delivery**: `nodemailer`
- **Date Utilities**: `date-fns`

---

## 3. Getting Started

### 3.1 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database instance (Neon PostgreSQL or local)

### 3.2 Installation

```bash
git clone <repository-url>
cd odoo-backend
npm install
```

### 3.3 Environment Setup

Copy `.env.example` to `.env` and configure your credentials:

```env
DATABASE_URL="postgresql://postgres@localhost:5432/peoplepay360?schema=public"
JWT_SECRET="peoplepay360-super-secret-jwt-key-for-development-and-testing-2026"
PORT=5000
CLIENT_ORIGIN="http://localhost:5173"

# Optional SMTP configuration
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="PeoplePay360 <payroll@peoplepay360.dev>"
```

### 3.4 Database Migration & Seeding

```bash
# Push schema to database and generate Prisma Client
npm run prisma:push
npm run prisma:generate

# Seed initial realistic demo data
npm run prisma:seed
```

### 3.5 Running the Server

```bash
# Development mode (with live nodemon reload)
npm run dev

# Production mode
npm start
```

---

## 4. Seed Credentials

All seed accounts use the default password: **`Password123!`**

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **ADMIN** | `admin@peoplepay360.dev` | Full system access, user management, and system administration |
| **HR_MANAGER** | `hr.manager@peoplepay360.dev` | Employees, contracts, attendance, schedules, time-off approvals |
| **HR_PAYROLL_USER** | `payroll.user@peoplepay360.dev` | HR access + Create, Read, Update, and Compute Payruns & Payslips |
| **HR_PAYROLL_MANAGER** | `payroll.manager@peoplepay360.dev` | Full HR & Payroll management, Salary Structure configuration, Payrun validation, Mark as Paid |
| **EMPLOYEE** | `employee@peoplepay360.dev` | Scoped self-service: View own profile, attendance check-in/out, request time-off, view own payslips |

---

## 5. Automated Tests

```bash
# Run standalone payroll unit tests and full end-to-end integration tests
npm test
```

---

## 6. API Reference & Endpoints

### 6.1 Standard Formats

**Paginated List Response**:
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

**Standard Error Response**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation"
  }
}
```

### 6.2 Key Endpoint Summary

#### Health & Authentication
- `GET  /api/health` — API health check
- `POST /api/auth/login` — Login with email & password, returns JWT token
- `GET  /api/auth/me` — Current authenticated user profile

#### Users (ADMIN only)
- `GET    /api/users`
- `POST   /api/users`
- `GET    /api/users/:id`
- `PATCH  /api/users/:id`
- `DELETE /api/users/:id`

#### Departments & Employees
- `GET    /api/departments`
- `POST   /api/departments`
- `GET    /api/departments/:id`
- `PATCH  /api/departments/:id`
- `DELETE /api/departments/:id`
- `GET    /api/employees` (Supports `search`, `department`, `status`, `type`)
- `POST   /api/employees`
- `GET    /api/employees/:id`
- `PATCH  /api/employees/:id`
- `DELETE /api/employees/:id`

#### Contracts & Working Schedules
- `GET    /api/contracts`
- `POST   /api/contracts`
- `GET    /api/contracts/:id`
- `PATCH  /api/contracts/:id`
- `DELETE /api/contracts/:id`
- `GET    /api/schedules`
- `POST   /api/schedules` (Calculates weekly hours on server)
- `GET    /api/schedules/:id`
- `PATCH  /api/schedules/:id`
- `DELETE /api/schedules/:id`

#### Attendance
- `GET    /api/attendance`
- `POST   /api/attendance` (Check-in)
- `PATCH  /api/attendance/:id/check-out` (Check-out with automatic status derivation)
- `PATCH  /api/attendance/:id` (Manual edit & correction audit)
- `DELETE /api/attendance/:id`

#### Time-Off & Allocations
- `GET    /api/time-off-types`
- `POST   /api/time-off-types`
- `GET    /api/allocations`
- `POST   /api/allocations`
- `GET    /api/time-off-requests`
- `POST   /api/time-off-requests`
- `PATCH  /api/time-off-requests/:id/approve` (Atomic balance deduction in `$transaction`)
- `PATCH  /api/time-off-requests/:id/refuse`

#### Salary Structures & Rules
- `GET    /api/salary-structures`
- `POST   /api/salary-structures`
- `PATCH  /api/salary-structures/:id/reorder-rules`
- `GET    /api/salary-rules`
- `POST   /api/salary-rules`
- `PATCH  /api/salary-rules/:id`
- `DELETE /api/salary-rules/:id`

#### Payroll & Payruns
- `GET    /api/payruns/eligible-employees` (Read-only simulation)
- `GET    /api/payruns`
- `POST   /api/payruns` (Creates DRAFT batch with draft payslips)
- `GET    /api/payruns/:id`
- `POST   /api/payruns/:id/compute` (Runs payroll engine & generates warnings)
- `POST   /api/payruns/:id/validate` (Blocks if CRITICAL warnings exist)
- `POST   /api/payruns/:id/mark-paid` (Enforces immutability)
- `POST   /api/payruns/:id/send-payslips` (Bulk email delivery)
- `DELETE /api/payruns/:id`

#### Payslips
- `GET    /api/payslips`
- `GET    /api/payslips/:id`
- `PATCH  /api/payslips/:id`
- `GET    /api/payslips/:id/pdf` (Streams PDF attachment)
- `POST   /api/payslips/:id/send-email` (Dispatches email with PDF)

#### Dashboard Analytics
- `GET    /api/dashboard/kpis` (Live DB aggregation)
- `GET    /api/dashboard/salary-cost-by-department`
- `GET    /api/dashboard/net-salary-trend`
- `GET    /api/dashboard/payslip-status-breakdown`
- `GET    /api/dashboard/attendance-overview`
- `GET    /api/dashboard/time-off-overview`
- `GET    /api/dashboard/warnings`
