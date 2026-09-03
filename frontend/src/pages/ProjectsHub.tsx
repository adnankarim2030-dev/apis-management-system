import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { Project, Client, User } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { useAuth } from '../context/AuthContext';

export const ProjectsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isCEO = user?.role === 'CEO' || user?.role === 'ADMIN';

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    clientId: '',
    projectManagerId: '',
    priority: 'MEDIUM',
    budget: 50000,
    deadline: '',
  });

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Project[]>('/projects', {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [clientsRes, usersRes] = await Promise.all([
        api.get<Client[]>('/clients'),
        api.get<User[]>('/users'),
      ]);
      setClients(clientsRes.data);
      setStaffUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load aux data:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchAuxData();
  }, [searchTerm, statusFilter, priorityFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.deadline) {
      alert('Please fill in required fields (Name and Deadline)');
      return;
    }

    try {
      await api.post('/projects', {
        ...newProject,
        budget: Number(newProject.budget),
      });
      setIsModalOpen(false);
      setNewProject({
        name: '',
        description: '',
        clientId: '',
        projectManagerId: '',
        priority: 'MEDIUM',
        budget: 50000,
        deadline: '',
      });
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-brand-400" />
            Projects Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise delivery workspaces with automated progress calculation and live risk detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isCEO && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Filters & View Toggle Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid or List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <FolderKanban className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new project.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onNavigate(`/projects/${proj.id}`)}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div>
                {/* Card Top Pill Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                    {proj.projectCode}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        proj.priority === 'URGENT'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : proj.priority === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {proj.priority}
                    </span>
                    <RiskBadge assessment={proj.riskAssessment} />
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              {/* Progress & Meta */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-mono font-bold text-white">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        proj.progress === 100
                          ? 'bg-emerald-500'
                          : proj.riskAssessment?.riskLevel === 'CRITICAL' || proj.riskAssessment?.riskLevel === 'HIGH'
                          ? 'bg-amber-500'
                          : 'bg-brand-500'
                      }`}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={proj.projectManager?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80'}
                      alt={proj.projectManager?.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-700"
                    />
                    <span className="text-slate-300 truncate max-w-[100px]">{proj.projectManager?.name?.split(' ')[0] || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(proj.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Code & Project</th>
                <th className="p-4">Client</th>
                <th className="p-4">Manager</th>
                <th className="p-4">Risk Status</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Deadline</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projects.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => onNavigate(`/projects/${proj.id}`)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="font-mono font-bold text-brand-400 text-[11px]">{proj.projectCode}</div>
                    <div className="font-bold text-white text-sm mt-0.5">{proj.name}</div>
                  </td>
                  <td className="p-4 text-slate-300">{proj.client?.company || 'Internal'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={proj.projectManager?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-slate-200">{proj.projectManager?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <RiskBadge assessment={proj.riskAssessment} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{proj.progress}%</span>
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-500 h-full rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    {new Date(proj.deadline).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Create New Project</h2>
            <p className="text-xs text-slate-400 mb-4">Initialize an executive project workspace in the database</p>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. NextGen Cloud Portal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Scope, objectives, and deliverables..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Client</label>
                  <select
                    value={newProject.clientId}
                    onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Internal / None --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Project Manager</label>
                  <select
                    value={newProject.projectManagerId}
                    onChange={(e) => setNewProject({ ...newProject, projectManagerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Assign Manager --</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deadline *</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
