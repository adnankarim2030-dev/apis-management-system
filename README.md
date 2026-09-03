# APIS — Project Management & Executive Staff Intelligence System

Production-ready, full-stack enterprise project management and staff intelligence application built with **React + TypeScript + Tailwind CSS** (Google Stitch design), **Node.js + Express + TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## 🌟 Key Features

1. **Executive Intelligence & Project Risk Engine**
   - Algorithmic, rule-based risk calculations evaluating deadline proximity, task overdue rates, blocked tasks, and velocity.
   - Outputs dynamic risk classifications (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with itemized reasons and health score (0-100).
2. **Staff Workload & Capacity Engine**
   - Analyzes assigned vs active tasks, estimated hours vs 40h/week baseline capacity.
   - Generates workload percentages (`OVERLOADED`, `HEALTHY`, `AVAILABLE`) and rebalancing recommendations without automated destructive mutations.
3. **Dynamic Project Progress Calculation**
   - Dynamically derives progress percentages from task status and weighting (`Completed tasks / Total tasks * 100`).
4. **Precision Timesheet & Session Tracking**
   - Active running stopwatch session tracker with automated overlap validation (blocks conflicting simultaneous timers).
   - Manual time entries and multi-level manager reviews.
5. **Role-Based Access Control (RBAC)**
   - Backend-enforced access controls across `CEO`, `ADMIN`, `PROJECT_MANAGER`, `ACCOUNT_MANAGER`, `DEPARTMENT_HEAD`, `STAFF`, and `VIEWER`.
6. **Real-time Event Streaming (Socket.IO)**
   - Live notifications, task status transitions, and CEO broadcast directives.
7. **Secure Document Management**
   - Whitelist extension filtering (`pdf`, `docx`, `xlsx`, `pptx`, `png`, `jpg`), size caps, and version history.
8. **Command Palette Global Search (`Ctrl+K`)**
   - Categorized search across Projects, Tasks, Staff, Clients, and Documents.

---

## 🛠️ Architecture

```
Frontend (React + TS + TanStack Query + Tailwind CSS)
    ↓
REST API & WebSockets (Socket.IO)
    ↓
Express Backend + JWT & RBAC Middleware
    ↓
Service Layer (Risk Engine, Workload Engine, Progress Engine, Timesheet Engine)
    ↓
Prisma ORM
    ↓
PostgreSQL / SQLite Database
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

The backend server will run at: `http://localhost:5000` (API at `/api`).

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend application will run at: `http://localhost:5173`.

---

## 🔑 Demo Logins (Password: `password123`)

For testing and pair-programming, you can also use the **Instant 1-Click Role Switcher** on the Login screen:

| Role | Email | Name | Designation |
| :--- | :--- | :--- | :--- |
| 👑 **CEO** | `ceo@apis.com` | Tariq Al-Mansoor | Chief Executive Officer |
| ⚡ **Admin** | `admin@apis.com` | Zaid Hassan | VP of Technology |
| 📊 **Project Manager** | `pm@apis.com` | Bilal Siddiqui | Senior Technical PM |
| 🤝 **Account Manager** | `am@apis.com` | Nadia Karim | Lead Client Partner |
| 🏛️ **Department Head** | `head@apis.com` | Omar Farooq | Head of Engineering |
| 💻 **Senior Dev (Staff)** | `sara@apis.com` | Sara Khan | Senior Full Stack Engineer |
| 🎨 **UI Architect** | `ahmed@apis.com` | Ahmed Raza | Lead UI/UX Architect |
| ☁️ **DevOps Engineer** | `ali@apis.com` | Ali Zain | Cloud DevOps Specialist |

---

## 🧪 Automated Testing

Run the end-to-end verification test suite:

```bash
cd backend
npm test
```
