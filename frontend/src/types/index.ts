// APIS Full-Stack Type Definitions

export type UserRole =
  | 'CEO'
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'ACCOUNT_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'STAFF'
  | 'VIEWER';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole | string;
  permissions?: string[];
  designation?: string;
  phone?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joiningDate?: string;
  department?: { id: string; name: string; code?: string } | null;
  team?: { id: string; name: string } | null;
  createdAt?: string;
  _count?: {
    assignedTasks?: number;
    managedProjects?: number;
    timesheets?: number;
  };
}

export type ProjectStatus =
  | 'PLANNING'
  | 'ACTIVE'
  | 'IN_REVIEW'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectRiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  healthScore: number;
  deadlineRisk: number;
  taskRisk: number;
  workloadRisk: number;
  reasons: string[];
  recommendations?: string[];
  calculatedAt?: string;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  clientId?: string;
  client?: { id: string; company: string; contactPerson?: string };
  accountManagerId?: string;
  accountManager?: { id: string; name: string; avatarUrl?: string };
  projectManagerId?: string;
  projectManager?: { id: string; name: string; avatarUrl?: string; email?: string };
  departmentId?: string;
  department?: { id: string; name: string; code?: string };
  teamId?: string;
  team?: { id: string; name: string };
  startDate: string;
  deadline: string;
  priority: PriorityLevel;
  status: ProjectStatus;
  budget: number;
  revenue: number;
  actualCost: number;
  progress: number;
  members?: { id: string; role: string; user: User }[];
  milestones?: Milestone[];
  tasks?: Task[];
  documents?: Document[];
  riskAssessment?: ProjectRiskAssessment;
  _count?: {
    tasks: number;
    documents: number;
    milestones: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus =
  | 'TO_DO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'BLOCKED';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface Task {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  projectId: string;
  project?: { id: string; name: string; projectCode: string; status?: string };
  milestoneId?: string;
  milestone?: Milestone;
  assigneeId?: string;
  assignee?: User;
  reviewerId?: string;
  reviewer?: User;
  priority: PriorityLevel;
  status: TaskStatus;
  startDate?: string;
  dueDate?: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  dependsOnTaskId?: string;
  dependsOnTask?: { id: string; title: string; status: TaskStatus; taskCode: string };
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  progress: number;
  projectId: string;
  tasks?: Task[];
}

export interface Timesheet {
  id: string;
  userId: string;
  user?: User;
  projectId?: string;
  project?: { id: string; name: string; projectCode: string };
  taskId?: string;
  task?: { id: string; title: string; taskCode: string };
  startTime: string;
  endTime?: string;
  breakMinutes: number;
  totalDurationMinutes: number;
  isRunning: boolean;
  date: string;
  notes?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export interface Client {
  id: string;
  company: string;
  contactPerson: string;
  email: string;
  phone?: string;
  industry?: string;
  status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
  notes?: string;
  address?: string;
  accountManager?: User;
  projects?: Project[];
  _count?: {
    projects: number;
    documents: number;
  };
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploader?: User;
  project?: { id: string; name: string; projectCode?: string };
  task?: { id: string; title: string };
  client?: { id: string; company: string };
  versions?: {
    id: string;
    versionNumber: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    changeSummary?: string;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  entityType: 'TASK' | 'DOCUMENT' | 'TIMESHEET' | 'PROJECT';
  entityId: string;
  requester: User;
  approver?: User;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
  comments?: string;
  decisionAt?: string;
  project?: { id: string; name: string; projectCode: string };
  task?: { id: string; title: string; taskCode: string };
  document?: { id: string; title: string; fileName: string; fileUrl: string };
  timesheet?: { id: string; totalDurationMinutes: number; date: string };
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  audience: 'EVERYONE' | 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'INDIVIDUAL';
  sender: User;
  receipts?: { isRead: boolean; isAcknowledged: boolean }[];
  createdAt: string;
}

export interface StaffWorkloadReport {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  designation?: string;
  departmentName?: string;
  assignedTasksCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  weeklyCapacityHours: number;
  workloadPercentage: number;
  status: 'AVAILABLE' | 'HEALTHY' | 'OVERLOADED';
  recommendation: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string;
  metadata?: string;
  timestamp: string;
}
