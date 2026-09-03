import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Shield,
  X,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { api } from '../api/client';
import { User, StaffWorkloadReport } from '../types';
import { WorkloadMeter } from '../components/common/WorkloadMeter';
import { useAuth } from '../context/AuthContext';

export const TeamHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isLeader = ['CEO', 'ADMIN', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'].includes(user?.role || '');

  const [users, setUsers] = useState<User[]>([]);
  const [workloads, setWorkloads] = useState<StaffWorkloadReport[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    designation: '',
    roleName: 'STAFF',
    departmentId: '',
    phone: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [uRes, wRes, dRes] = await Promise.all([
        api.get<User[]>('/users', { search: searchTerm || undefined, role: roleFilter || undefined }),
        api.get<StaffWorkloadReport[]>('/users/workload'),
        api.get<any[]>('/departments'),
      ]);
      setUsers(uRes.data);
      setWorkloads(wRes.data);
      setDepartments(dRes.data);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, roleFilter]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) {
      alert('Name and Email are required');
      return;
    }
    try {
      await api.post('/users', newEmployee);
      setIsAddModalOpen(false);
      setNewEmployee({
        name: '',
        email: '',
        designation: '',
        roleName: 'STAFF',
        departmentId: '',
        phone: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Team & Staff Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Workload balancing, capacity optimization, and organizational directory
          </p>
        </div>

        {isLeader && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, employee ID, role..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Roles</option>
            <option value="CEO">CEO</option>
            <option value="ADMIN">Admin</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="ACCOUNT_MANAGER">Account Manager</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
            <option value="STAFF">Staff Engineer</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Team Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">No team members found matching filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((member) => {
            const workload = workloads.find((w) => w.userId === member.id);

            return (
              <div
                key={member.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Avatar & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={member.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white">{member.name}</h3>
                        <div className="text-xs text-slate-400">{member.designation || 'Specialist'}</div>
                        <span className="font-mono text-[10px] text-brand-400 font-semibold">{member.employeeId}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                      {typeof member.role === 'object' ? (member.role as any).name : member.role}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300 truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300">{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{member.department?.name || 'General Operations'}</span>
                    </div>
                  </div>
                </div>

                {/* Workload Capacity Meter */}
                {workload && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <WorkloadMeter
                      percentage={workload.workloadPercentage}
                      status={workload.status}
                    />
                    <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                      <strong className="text-slate-300">Rec:</strong> {workload.recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Team Member</h2>
            <p className="text-xs text-slate-400 mb-4">Create organizational employee profile & access credentials</p>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="e.g. Zoya Akhtar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="zoya@apis.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    placeholder="e.g. Frontend Specialist"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">RBAC Role</label>
                  <select
                    value={newEmployee.roleName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, roleName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="STAFF">STAFF (Engineer / Designer)</option>
                    <option value="PROJECT_MANAGER">PROJECT MANAGER</option>
                    <option value="ACCOUNT_MANAGER">ACCOUNT MANAGER</option>
                    <option value="DEPARTMENT_HEAD">DEPARTMENT HEAD</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={newEmployee.departmentId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, departmentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
