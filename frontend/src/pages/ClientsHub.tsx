import React, { useEffect, useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Mail,
  Phone,
  FolderKanban,
  UserCheck,
  DollarSign,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';
import { Client, User } from '../types';
import { useAuth } from '../context/AuthContext';

export const ClientsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isManager = ['CEO', 'ADMIN', 'ACCOUNT_MANAGER', 'PROJECT_MANAGER'].includes(user?.role || '');

  const [clients, setClients] = useState<Client[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Client Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    company: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: '',
    address: '',
    notes: '',
    accountManagerId: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cRes, uRes] = await Promise.all([
        api.get<Client[]>('/clients', { search: searchTerm || undefined }),
        api.get<User[]>('/users'),
      ]);
      setClients(cRes.data);
      setStaffUsers(uRes.data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.company || !newClient.contactPerson || !newClient.email) {
      alert('Company name, contact person, and email are required');
      return;
    }
    try {
      await api.post('/clients', newClient);
      setIsModalOpen(false);
      setNewClient({
        company: '',
        contactPerson: '',
        email: '',
        phone: '',
        industry: '',
        address: '',
        notes: '',
        accountManagerId: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create client');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-orange-400" />
            Client Accounts Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise partnerships, account managers, and associated deliverable projects
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Client Account
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, contact person, industry..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Clients Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">No client accounts found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {client.industry || 'Enterprise'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{client.company}</h3>
                    <div className="text-xs text-slate-400">Primary Contact: <strong className="text-slate-200">{client.contactPerson}</strong></div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {client.status}
                  </span>
                </div>

                {/* Contact & Account Manager */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{client.phone}</span>
                    </div>
                  )}
                  {client.accountManager && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-850">
                      <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                      <span>Account Lead: <strong className="text-slate-200">{client.accountManager.name}</strong></span>
                    </div>
                  )}
                </div>

                {/* Linked Projects */}
                {client.projects && client.projects.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active Projects ({client.projects.length})
                    </div>
                    <div className="space-y-1">
                      {client.projects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => onNavigate(`/projects/${p.id}`)}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-850 cursor-pointer border border-slate-850 text-xs transition-colors"
                        >
                          <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                          <span className="font-mono text-brand-400 text-[11px] font-bold">{p.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">New Client Account</h2>
            <p className="text-xs text-slate-400 mb-4">Register corporate client in organizational portfolio</p>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="e.g. Apex Global Technologies"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })}
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="marcus@apextech.io"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                    placeholder="e.g. Cloud Computing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Account Manager</label>
                  <select
                    value={newClient.accountManagerId}
                    onChange={(e) => setNewClient({ ...newClient, accountManagerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Assign Lead --</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Address / HQ</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
