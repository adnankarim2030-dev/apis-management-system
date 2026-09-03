import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Users,
} from 'lucide-react';
import { api } from '../api/client';

export const ReportsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [reports, setReports] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const [rRes, dRes] = await Promise.all([
        api.get('/reports', { departmentId: selectedDept || undefined }),
        api.get<any[]>('/departments'),
      ]);
      setReports(rRes.data);
      setDepartments(dRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDept]);

  const { summary, projectStatusSummary, staffPerformance, hoursByProject, detailedProjects } =
    reports || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-yellow-400" />
            Executive Reports & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-department delivery velocity, task completion efficiency, and timesheet utilization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Overall Delivery Rate</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400">
                {summary?.overallCompletionRate || 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {summary?.completedTasks || 0} of {summary?.totalTasks || 0} tasks finished
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Total Hours Logged</div>
              <div className="text-2xl font-extrabold font-mono text-white">
                {summary?.totalHoursLogged || 0} hrs
              </div>
              <div className="text-[11px] text-cyan-400 mt-1">Across all project teams</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">In-Progress Tasks</div>
              <div className="text-2xl font-extrabold font-mono text-brand-400">
                {summary?.inProgressTasks || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Active sprints</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-rose-400 mb-1">Overdue Delivery Items</div>
              <div className="text-2xl font-extrabold font-mono text-rose-400">
                {summary?.overdueTasks || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{summary?.blockedTasks || 0} blocked tasks</div>
            </div>
          </div>

          {/* Leaderboard & Hours Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Performance Leaderboard */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Staff Completion Efficiency
              </h2>

              <div className="space-y-3">
                {staffPerformance?.map((staff: any, idx: number) => (
                  <div key={staff.userId} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white">{staff.name}</div>
                        <div className="text-[10px] text-slate-400">{staff.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{staff.completedTasks} / {staff.totalTasks} tasks</span>
                      <span className="font-mono font-bold text-emerald-400">{staff.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours by Project */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Logged Hours Distribution
              </h2>

              <div className="space-y-3">
                {hoursByProject && Object.entries(hoursByProject).map(([projName, hours]: any) => (
                  <div key={projName} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white truncate max-w-[280px]">{projName}</span>
                      <span className="font-mono font-bold text-cyan-400">{hours} hrs</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${Math.min((hours / (summary?.totalHoursLogged || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Projects Report Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Project Portfolio Financials</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-4">Project</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Lead</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Actual Cost</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {detailedProjects?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-4">
                        <div className="font-mono text-brand-400 text-[11px] font-bold">{p.code}</div>
                        <div className="font-bold text-white text-sm">{p.name}</div>
                      </td>
                      <td className="p-4 text-slate-300">{p.client || 'Internal'}</td>
                      <td className="p-4 text-slate-300">{p.manager || 'Unassigned'}</td>
                      <td className="p-4 font-mono text-slate-200">${p.budget.toLocaleString()}</td>
                      <td className="p-4 font-mono text-slate-200">${p.actualCost.toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-brand-400">{p.progress}%</td>
                      <td className="p-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
