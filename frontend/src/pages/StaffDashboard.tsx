import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Clock,
  Play,
  Square,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Task, Timesheet, Project } from '../types';

export const StaffDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Task Creation Modal
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'MEDIUM',
    estimatedHours: 8,
    dueDate: '',
  });

  // Timer State
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<string>('');
  const [timerNotes, setTimerNotes] = useState('');
  const [isStartingTimer, setIsStartingTimer] = useState(false);

  const fetchStaffDashboard = async () => {
    try {
      setIsLoading(true);
      const [dashRes, projRes] = await Promise.all([
        api.get('/dashboard/staff'),
        api.get<Project[]>('/projects'),
      ]);
      setData(dashRes.data);
      setAllProjects(projRes.data || []);
      if (projRes.data?.length && !newTask.projectId) {
        setNewTask((prev) => ({ ...prev, projectId: projRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDashboard();
  }, [user?.id]);

  const handleStartTimer = async () => {
    if (!selectedTaskForTimer) return;
    try {
      setIsStartingTimer(true);
      const selectedTask = data?.todayTasks?.find((t: Task) => t.id === selectedTaskForTimer);
      await api.post('/timesheets/start', {
        taskId: selectedTaskForTimer,
        projectId: selectedTask?.projectId,
        notes: timerNotes || undefined,
      });
      setSelectedTaskForTimer('');
      setTimerNotes('');
      fetchStaffDashboard();
      window.location.reload(); // Refresh active header timer
    } catch (err: any) {
      alert(err.message || 'Could not start timer');
    } finally {
      setIsStartingTimer(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchStaffDashboard();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleCreateStaffTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!newTask.projectId) {
      setFormError('Please select a project');
      return;
    }
    try {
      setIsCreating(true);
      setFormError(null);
      await api.post('/tasks', {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || undefined,
        projectId: newTask.projectId,
        assigneeId: user?.id,
        priority: newTask.priority,
        estimatedHours: Number(newTask.estimatedHours) || 0,
        dueDate: newTask.dueDate || undefined,
      });
      setIsCreateTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        projectId: allProjects.length > 0 ? allProjects[0].id : '',
        priority: 'MEDIUM',
        estimatedHours: 8,
        dueDate: '',
      });
      fetchStaffDashboard();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add task');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your workbench...</p>
        </div>
      </div>
    );
  }

  const { metrics, todayTasks, overdueTasks, myProjects, runningSession } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}
            alt={user?.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500/40 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-extrabold text-white">{user?.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                {user?.designation || 'Staff Engineer'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Department: <strong className="text-slate-200">{data?.user?.department || 'Engineering'}</strong> • Employee ID: <span className="font-mono">{user?.employeeId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormError(null);
              setIsCreateTaskModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add My Task</span>
          </button>
          <button
            onClick={() => onNavigate('/tasks')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            Tasks Board →
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-1 text-xs">
            <span>Today's Logged Hours</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{metrics?.todayHours || 0} hrs</div>
          <div className="text-[11px] text-slate-400 mt-1">Week: {metrics?.weekHours || 0} / 40 hrs</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-1 text-xs">
            <span>Assigned Active Tasks</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{metrics?.activeTasks || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics?.completedTasks || 0} completed</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-rose-400 mb-1 text-xs">
            <span>Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">{metrics?.overdueTasksCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">requires immediate action</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-1 text-xs">
            <span>Task Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{metrics?.efficiencyRate || 100}%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Performance High</div>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Alert Banner if any */}
          {overdueTasks?.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" /> Attention: {overdueTasks.length} Overdue Task(s)
              </div>
              <div className="space-y-1.5">
                {overdueTasks.map((t: Task) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 text-xs">
                    <span className="font-semibold text-slate-200">{t.title}</span>
                    <span className="text-[10px] text-rose-400 font-mono">
                      Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Overdue'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Today's Action Items ({todayTasks?.length || 0})
                </h2>
                <p className="text-xs text-slate-400">Directly transition status and track live delivery</p>
              </div>
              <button
                onClick={() => onNavigate('/tasks')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                Kanban board →
              </button>
            </div>

            {(!todayTasks || todayTasks.length === 0) ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">No pending tasks for today!</div>
                <p className="text-xs text-slate-400 mt-0.5">All scheduled deliverables are up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                            {task.taskCode}
                          </span>
                          <span className="text-xs text-slate-400">{task.project?.name}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">{task.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : task.status === 'IN_REVIEW'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : task.status === 'BLOCKED'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Quick 1-click status transitions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="text-slate-400 text-[11px]">
                        Est: <strong className="text-slate-200">{task.estimatedHours}h</strong> • Logged: <strong className="text-slate-200">{task.actualHours}h</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {task.status === 'TO_DO' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Start Work
                          </button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'IN_REVIEW')}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Submit for Review
                          </button>
                        )}
                        {task.status === 'IN_REVIEW' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Timer & My Projects */}
        <div className="space-y-6">
          {/* Quick Start Timer Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Start Time Tracking</h2>
                <p className="text-xs text-slate-400">Log actual minutes worked to project timesheet</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Task</label>
                <select
                  value={selectedTaskForTimer}
                  onChange={(e) => setSelectedTaskForTimer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose active task --</option>
                  {todayTasks?.map((t: Task) => (
                    <option key={t.id} value={t.id}>
                      {t.taskCode}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Notes (Optional)</label>
                <input
                  type="text"
                  value={timerNotes}
                  onChange={(e) => setTimerNotes(e.target.value)}
                  placeholder="e.g. Unit tests and API endpoints"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                onClick={handleStartTimer}
                disabled={!selectedTaskForTimer || isStartingTimer}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isStartingTimer ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>

          {/* My Projects */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-brand-400" /> My Projects
              </h2>
              <button
                onClick={() => onNavigate('/projects')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                View all →
              </button>
            </div>

            <div className="space-y-2.5">
              {myProjects?.map((proj: any) => (
                <div
                  key={proj.id}
                  onClick={() => onNavigate(`/projects/${proj.id}`)}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white truncate">{proj.name}</span>
                    <span className="font-mono text-brand-400 font-bold">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Create Task Modal for Staff */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateTaskModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Deliverable / Task</h2>
            <p className="text-xs text-slate-400 mb-4">Create a task assigned directly to you</p>

            <form onSubmit={handleCreateStaffTask} className="space-y-3 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Project *</label>
                <select
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Design Digital Billboard Creatives"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
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

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Deliverable...</span>
                    </>
                  ) : (
                    <span>Add Task</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
