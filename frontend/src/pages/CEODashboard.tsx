import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  AlertTriangle,
  Users,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Send,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { RiskBadge } from '../components/common/RiskBadge';
import { WorkloadMeter } from '../components/common/WorkloadMeter';
import { useAuth } from '../context/AuthContext';

export const CEODashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchCEODashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard/ceo');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load CEO dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCEODashboard();
  }, []);

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementText.trim()) return;
    try {
      setIsPublishing(true);
      await api.post('/announcements', {
        title: announcementTitle,
        message: announcementText,
        priority: 'HIGH',
        audience: 'EVERYONE',
      });
      setAnnouncementTitle('');
      setAnnouncementText('');
      fetchCEODashboard();
    } catch (err) {
      console.error('Failed to publish announcement:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-slate-400">Computing Executive Intelligence & Project Risks...</p>
        </div>
      </div>
    );
  }

  const { metrics, atRiskProjects, departmentAnalytics, staffWorkloadTop, recentActivities } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3" /> Executive Intelligence
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Sync</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Chief Executive Officer'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time organizational performance, algorithmic risk detection, and resource allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCEODashboard}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Intelligence
          </button>
          <button
            onClick={() => onNavigate('/projects')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all hover:translate-y-[-1px]"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{metrics?.activeProjects || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">of {metrics?.totalProjects || 0} total projects</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">At-Risk Projects</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">{metrics?.atRiskProjectsCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">detected by risk engine</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{metrics?.completedProjects || 0}</div>
          <div className="text-[11px] text-emerald-400 mt-1">100% delivered</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Staff Force</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{metrics?.activeStaff || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics?.overloadedStaffCount || 0} overloaded</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-white">
            ${((metrics?.totalRevenue || 0) / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cost: ${((metrics?.totalActualCost || 0) / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Sign-off</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">{metrics?.pendingApprovals || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <button onClick={() => onNavigate('/approvals')} className="text-brand-400 hover:underline">
              Review inbox →
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: At-Risk Projects & Broadcast Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At Risk Projects Radar */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Critical Project Risk Radar ({atRiskProjects?.length || 0})
                </h2>
                <p className="text-xs text-slate-400">Rule-engine evaluated bottlenecks requiring executive attention</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/projects')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              View all projects →
            </button>
          </div>

          {(!atRiskProjects || atRiskProjects.length === 0) ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">All Active Projects Operating Smoothly</div>
              <p className="text-xs text-slate-400 mt-0.5">No critical deadline risks or task blockers detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskProjects.map((proj: any) => (
                <div
                  key={proj.projectId}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                        {proj.projectCode}
                      </span>
                      <h3
                        onClick={() => onNavigate(`/projects/${proj.projectId}`)}
                        className="text-sm font-bold text-white hover:text-brand-400 cursor-pointer transition-colors"
                      >
                        {proj.projectName}
                      </h3>
                    </div>
                    <RiskBadge
                      assessment={{
                        riskLevel: proj.riskLevel,
                        healthScore: proj.healthScore,
                        deadlineRisk: 80,
                        taskRisk: 75,
                        workloadRisk: 60,
                        reasons: proj.reasons || [],
                      }}
                    />
                  </div>

                  {/* Reasons list */}
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                      Why this project is flagged:
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {proj.reasons?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-rose-400">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Manager: <strong className="text-slate-200">{proj.managerName || 'Unassigned'}</strong></span>
                    </div>
                    <button
                      onClick={() => onNavigate(`/projects/${proj.projectId}`)}
                      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      Inspect Details <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CEO Broadcast Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Issue CEO Broadcast
                </h2>
                <p className="text-xs text-slate-400">Direct executive directive to all staff and leads</p>
              </div>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Directive Subject</label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Critical Sprint Prioritization"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Enter executive directive or announcement details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isPublishing}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {isPublishing ? 'Broadcasting...' : 'Broadcast to All Staff'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Automatic socket delivery to all connected clients</span>
              <span className="font-mono text-emerald-400 text-[10px]">Realtime Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Department Velocity & Top Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Analytics */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              Department Delivery Performance
            </h2>
            <span className="text-xs text-slate-400 font-mono">5 Departments</span>
          </div>

          <div className="space-y-3">
            {departmentAnalytics?.map((dept: any) => (
              <div key={dept.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">{dept.name}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">({dept.code})</span>
                  </div>
                  <span className="font-mono font-bold text-brand-400">{dept.averageProgress}% Avg Progress</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dept.averageProgress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>{dept.memberCount} Team Members</span>
                  <span>{dept.projectCount} Projects ({dept.completedCount} Completed)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Workload Capacity Top List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Staff Capacity & Workload Balance
            </h2>
            <button
              onClick={() => onNavigate('/team')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Full directory →
            </button>
          </div>

          <div className="space-y-3">
            {staffWorkloadTop?.map((staff: any) => (
              <div key={staff.userId} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={staff.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                      alt={staff.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{staff.name}</div>
                      <div className="text-[10px] text-slate-400">{staff.designation}</div>
                    </div>
                  </div>
                  <WorkloadMeter percentage={staff.workloadPercentage} status={staff.status} compact />
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/70">
                  <span className="text-slate-300 font-medium">Engine Rec:</span> {staff.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
