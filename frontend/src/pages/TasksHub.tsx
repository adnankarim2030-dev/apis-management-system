import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  ArrowRight,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { api } from '../api/client';
import { Task, Project, User } from '../types';
import { useAuth } from '../context/AuthContext';

export const TasksHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Active Task Detail Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Create Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    estimatedHours: 8,
    dueDate: '',
  });

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Task[]>('/tasks', {
        search: searchTerm || undefined,
        projectId: projectFilter || undefined,
        priority: priorityFilter || undefined,
        assigneeId: assigneeFilter || undefined,
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAux = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        api.get<Project[]>('/projects'),
        api.get<User[]>('/users'),
      ]);
      setProjects(pRes.data);
      setStaffUsers(uRes.data);
    } catch (err) {
      console.error('Failed to load aux data:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAux();
  }, [searchTerm, projectFilter, priorityFilter, assigneeFilter]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
      if (selectedTask?.id === taskId) {
        const updated = await api.get<Task>(`/tasks/${taskId}`);
        setSelectedTask(updated.data);
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    if (!selectedTask) return;
    try {
      await api.put(`/tasks/${selectedTask.id}/subtasks/${subtaskId}`, { isCompleted });
      const updated = await api.get<Task>(`/tasks/${selectedTask.id}`);
      setSelectedTask(updated.data);
      fetchTasks();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    try {
      await api.post(`/tasks/${selectedTask.id}/subtasks`, { title: newSubtaskTitle });
      setNewSubtaskTitle('');
      const updated = await api.get<Task>(`/tasks/${selectedTask.id}`);
      setSelectedTask(updated.data);
      fetchTasks();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId) {
      alert('Task title and Project are required');
      return;
    }
    try {
      await api.post('/tasks', {
        ...newTask,
        estimatedHours: Number(newTask.estimatedHours),
      });
      setIsCreateModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        projectId: '',
        assigneeId: '',
        priority: 'MEDIUM',
        estimatedHours: 8,
        dueDate: '',
      });
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const KANBAN_COLUMNS = [
    { id: 'TO_DO', label: 'To Do', color: 'border-slate-700 text-slate-300' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/40 text-blue-400' },
    { id: 'IN_REVIEW', label: 'In Review', color: 'border-purple-500/40 text-purple-400' },
    { id: 'REVISION_REQUIRED', label: 'Revision', color: 'border-amber-500/40 text-amber-400' },
    { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-500/40 text-emerald-400' },
    { id: 'BLOCKED', label: 'Blocked', color: 'border-rose-500/40 text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            Tasks & Workflow Board
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            7-stage lifecycle management with automatic project progress synchronization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode}: {p.name}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Assignees</option>
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchTasks}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Board
        </button>
      </div>

      {/* Kanban Board Layout */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => {
              if (col.id === 'COMPLETED') return t.status === 'COMPLETED' || t.status === 'APPROVED';
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col space-y-3 min-w-[240px]"
              >
                {/* Column Header */}
                <div className={`flex justify-between items-center pb-2 border-b ${col.color}`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-full text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 min-h-[300px]">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg space-y-2.5 group"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                          {task.taskCode}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-500/20 text-rose-400'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="text-[11px] text-slate-400 truncate">
                        {task.project?.name}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={task.assignee?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60'}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="truncate max-w-[70px]">{task.assignee?.name?.split(' ')[0] || 'Unassigned'}</span>
                        </div>

                        {task.dueDate && (
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                  {selectedTask.taskCode}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{selectedTask.project?.name}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
            </div>

            {/* Status Transition Control */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-300">Move Status Workflow:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'TO_DO',
                  'IN_PROGRESS',
                  'IN_REVIEW',
                  'REVISION_REQUIRED',
                  'COMPLETED',
                  'BLOCKED',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedTask.id, st)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase transition-all ${
                      selectedTask.status === st
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {selectedTask.description || 'No detailed technical description provided.'}
              </p>
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Subtasks Checklist ({selectedTask.subtasks?.filter((s) => s.isCompleted).length || 0} / {selectedTask.subtasks?.length || 0})</span>
              </h3>

              <div className="space-y-1.5">
                {selectedTask.subtasks?.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
                    />
                    <span className={`text-xs ${st.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new subtask check item..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Task Assignee & Hours Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Assignee</span>
                <div className="font-bold text-slate-200 mt-0.5">{selectedTask.assignee?.name || 'Unassigned'}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Priority</span>
                <div className="font-bold text-slate-200 mt-0.5 font-mono">{selectedTask.priority}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Estimated</span>
                <div className="font-bold text-slate-200 mt-0.5 font-mono">{selectedTask.estimatedHours}h</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Actual Logged</span>
                <div className="font-bold text-brand-400 mt-0.5 font-mono">{selectedTask.actualHours}h</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Create New Task</h2>
            <p className="text-xs text-slate-400 mb-4">Add a new deliverable to project pipeline</p>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Project *</label>
                <select
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
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
                  placeholder="e.g. Implement OOH Geo-verification"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
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
                        {u.name} ({u.role})
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
                  onClick={() => setIsCreateModalOpen(false)}
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
