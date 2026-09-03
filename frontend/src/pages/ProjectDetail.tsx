import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Clock,
  Sparkles,
  Calendar,
  DollarSign,
  Plus,
  Activity,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { Project, Task, Milestone, User } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { useAuth } from '../context/AuthContext';

export const ProjectDetail: React.FC<{ projectId: string; onNavigate: (path: string) => void }> = ({
  projectId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'team' | 'documents' | 'activity'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // New Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: '',
    reviewerId: '',
    priority: 'MEDIUM',
    estimatedHours: 8,
    dueDate: '',
  });

  const fetchProjectDetail = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Project>(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      setStaffUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
    fetchUsers();
  }, [projectId]);

  const handleRefreshRisk = async () => {
    try {
      await api.post(`/projects/${projectId}/refresh-risk`, {});
      fetchProjectDetail();
    } catch (err) {
      console.error('Failed to refresh risk:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      await api.post('/tasks', {
        ...newTask,
        projectId,
        estimatedHours: Number(newTask.estimatedHours),
      });
      setIsTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        assigneeId: '',
        reviewerId: '',
        priority: 'MEDIUM',
        estimatedHours: 8,
        dueDate: '',
      });
      fetchProjectDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProjectDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-base font-bold text-white">Project Not Found</h2>
        <button
          onClick={() => onNavigate('/projects')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const { riskAssessment } = project;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <button
            onClick={() => onNavigate('/projects')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Hub
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/20">
              {project.projectCode}
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">{project.description || 'Enterprise project workspace.'}</p>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge assessment={riskAssessment} showDetails />
          <button
            onClick={handleRefreshRisk}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            title="Recalculate project risk score"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate Risk
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & Health', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'tasks', label: `Tasks (${project.tasks?.length || 0})`, icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'milestones', label: `Milestones (${project.milestones?.length || 0})`, icon: <Calendar className="w-4 h-4" /> },
          { id: 'team', label: `Team (${project.members?.length || 0})`, icon: <Users className="w-4 h-4" /> },
          { id: 'documents', label: `Documents (${project.documents?.length || 0})`, icon: <FileText className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview & Health */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Dynamically Computed Progress</div>
              <div className="text-2xl font-extrabold font-mono text-white mb-2">{project.progress}%</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Deadline Date</div>
              <div className="text-lg font-bold font-mono text-white mb-1">
                {new Date(project.deadline).toLocaleDateString()}
              </div>
              <div className="text-[11px] text-slate-400">
                Started: {new Date(project.startDate).toLocaleDateString()}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Budget Allocation</div>
              <div className="text-lg font-bold font-mono text-white mb-1">
                ${project.budget.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400">
                Revenue: ${project.revenue.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Project Manager</div>
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={project.projectManager?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80'}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-slate-200">
                  {project.projectManager?.name || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Intelligence & Risk Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Executive Risk & Intelligence Assessment
                  </h2>
                  <p className="text-xs text-slate-400">Automated multi-factor risk diagnostics</p>
                </div>
              </div>
              <RiskBadge assessment={riskAssessment} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Identified Risk Triggers ({riskAssessment?.reasons?.length || 0})
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {riskAssessment?.reasons?.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Engine Mitigations & Next Steps
                </h3>
                <ul className="space-y-1.5 text-xs text-brand-300">
                  {riskAssessment?.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tasks Kanban & List */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Project Deliverables ({project.tasks?.length || 0})
            </h2>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
            >
              + Create Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['TO_DO', 'IN_PROGRESS', 'COMPLETED'].map((colStatus) => {
              const colTasks = project.tasks?.filter((t) => {
                if (colStatus === 'COMPLETED') return t.status === 'COMPLETED' || t.status === 'APPROVED';
                if (colStatus === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW' || t.status === 'REVISION_REQUIRED' || t.status === 'BLOCKED';
                return t.status === 'TO_DO';
              }) || [];

              return (
                <div key={colStatus} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {colStatus.replace('_', ' ')} ({colTasks.length})
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[200px]">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                            {task.taskCode}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                              task.status === 'BLOCKED'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white">{task.title}</h4>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={task.assignee?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60'}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>{task.assignee?.name?.split(' ')[0] || 'Unassigned'}</span>
                          </div>
                          <span>{task.estimatedHours}h est</span>
                        </div>

                        {/* Status change actions */}
                        <div className="flex items-center justify-end gap-1 pt-1">
                          {task.status === 'TO_DO' && (
                            <button
                              onClick={() => handleTaskStatusChange(task.id, 'IN_PROGRESS')}
                              className="text-[10px] px-2 py-0.5 rounded bg-brand-600/20 text-brand-300 hover:bg-brand-600/40"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleTaskStatusChange(task.id, 'COMPLETED')}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Milestones */}
      {activeTab === 'milestones' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Project Milestones ({project.milestones?.length || 0})
          </h2>
          <div className="space-y-3">
            {project.milestones?.map((m) => (
              <div key={m.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{m.title}</span>
                  <span className="font-mono text-brand-400 font-bold">{m.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full" style={{ width: `${m.progress}%` }} />
                </div>
                <div className="text-[11px] text-slate-400">
                  Target Due: {new Date(m.dueDate).toLocaleDateString()} • Status: <strong className="text-slate-200">{m.status}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Team */}
      {activeTab === 'team' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Assigned Project Team ({project.members?.length || 0})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.members?.map((member) => (
              <div key={member.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <img
                  src={member.user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                  alt={member.user?.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">{member.user?.name}</div>
                  <div className="text-[10px] text-slate-400">{member.user?.designation || member.role}</div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400">
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Project Vault ({project.documents?.length || 0})
            </h2>
            <button
              onClick={() => onNavigate('/documents')}
              className="text-xs text-brand-400 hover:underline"
            >
              Open File Vault →
            </button>
          </div>
          <div className="space-y-2">
            {project.documents?.map((doc) => (
              <div key={doc.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-400" />
                  <div>
                    <div className="font-semibold text-white">{doc.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{doc.fileType} • {(doc.fileSize / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Task to {project.projectCode}</h2>
            <p className="text-xs text-slate-400 mb-4">Create deliverable with assigned engineer and deadline</p>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Implement Webhook Handlers"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Technical acceptance criteria..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assignee</label>
                  <select
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.designation || u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
