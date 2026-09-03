import React, { useEffect, useState } from 'react';
import {
  Clock,
  Play,
  Square,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderKanban,
  CheckSquare,
} from 'lucide-react';
import { api } from '../api/client';
import { Timesheet, Project, Task } from '../types';
import { useAuth } from '../context/AuthContext';

export const TimesheetsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isManager = ['CEO', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD'].includes(user?.role || '');

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSession, setActiveSession] = useState<Timesheet | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Entry Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    projectId: '',
    taskId: '',
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tsRes, activeRes, pRes, tRes] = await Promise.all([
        api.get<Timesheet[]>('/timesheets'),
        api.get<Timesheet | null>('/timesheets/active'),
        api.get<Project[]>('/projects'),
        api.get<Task[]>('/tasks'),
      ]);
      setTimesheets(tsRes.data);
      setActiveSession(activeRes.data);
      setProjects(pRes.data);
      setTasks(tRes.data);

      if (activeRes.data) {
        const start = new Date(activeRes.data.startTime).getTime();
        setElapsedSeconds(Math.max(Math.floor((Date.now() - start) / 1000), 0));
      }
    } catch (err) {
      console.error('Failed to load timesheets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    if (!activeSession) return;
    const ticker = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, [activeSession]);

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/timesheets/${activeSession.id}/stop`, {});
      setActiveSession(null);
      setElapsedSeconds(0);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to stop session');
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEntry.startTime || !manualEntry.endTime) {
      alert('Start time and End time are required');
      return;
    }

    try {
      const startDateTime = `${manualEntry.date}T${manualEntry.startTime}:00`;
      const endDateTime = `${manualEntry.date}T${manualEntry.endTime}:00`;

      await api.post('/timesheets/manual', {
        projectId: manualEntry.projectId || undefined,
        taskId: manualEntry.taskId || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        breakMinutes: Number(manualEntry.breakMinutes),
        notes: manualEntry.notes,
        date: manualEntry.date,
      });

      setIsManualModalOpen(false);
      setManualEntry({
        projectId: '',
        taskId: '',
        startTime: '',
        endTime: '',
        breakMinutes: 0,
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to log manual time');
    }
  };

  const handleReviewTimesheet = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post(`/timesheets/${id}/review`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Review action failed');
    }
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalLoggedHours = Number(
    (timesheets.reduce((sum, ts) => sum + (ts.totalDurationMinutes || 0), 0) / 60).toFixed(1)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-cyan-400" />
            Timesheets & Activity Tracking
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Precision session logging, duration auditing, and manager approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Live Timer Widget Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              {activeSession ? 'Active Session Live' : 'Timer Idle'}
            </span>
            <div className="text-3xl font-extrabold font-mono text-white mt-0.5">
              {activeSession ? formatTimer(elapsedSeconds) : '00:00:00'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeSession
                ? `Working on: ${activeSession.task?.title || activeSession.project?.name || 'General Task'}`
                : 'Select an assigned task on your dashboard to start tracking'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeSession ? (
            <button
              onClick={handleStopSession}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop & Log Session
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/staff-dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Pick Task on Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Total Hours Logged</div>
          <div className="text-2xl font-extrabold font-mono text-white">{totalLoggedHours} hrs</div>
          <div className="text-[11px] text-slate-400 mt-1">{timesheets.length} recorded sessions</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Approved Log Entries</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {timesheets.filter((t) => t.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Verified & billable</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 mb-1">Pending Approval</div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {timesheets.filter((t) => t.status === 'SUBMITTED').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting manager sign-off</div>
        </div>
      </div>

      {/* Timesheet Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Timesheet History</h2>
          <span className="text-xs text-slate-400 font-mono">{timesheets.length} records</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No timesheet records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Project / Task</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4">Status</th>
                  {isManager && <th className="p-4 text-right">Manager Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={ts.user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-200">{ts.user?.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{ts.project?.name || 'General Operations'}</div>
                      {ts.task && <div className="text-[11px] text-slate-400 font-mono">{ts.task.title}</div>}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {new Date(ts.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-cyan-400">
                      {(ts.totalDurationMinutes / 60).toFixed(1)} hrs ({ts.totalDurationMinutes}m)
                    </td>
                    <td className="p-4 text-slate-400 max-w-[200px] truncate">{ts.notes || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          ts.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : ts.status === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {ts.status}
                      </span>
                    </td>
                    {isManager && (
                      <td className="p-4 text-right">
                        {ts.status === 'SUBMITTED' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewTimesheet(ts.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewTimesheet(ts.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Manual Time Entry</h2>
            <p className="text-xs text-slate-400 mb-4">Log worked duration directly to timesheet database</p>

            <form onSubmit={handleManualEntry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Project</label>
                  <select
                    value={manualEntry.projectId}
                    onChange={(e) => setManualEntry({ ...manualEntry, projectId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={manualEntry.startTime}
                    onChange={(e) => setManualEntry({ ...manualEntry, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={manualEntry.endTime}
                    onChange={(e) => setManualEntry({ ...manualEntry, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Break (Mins)</label>
                  <input
                    type="number"
                    value={manualEntry.breakMinutes}
                    onChange={(e) => setManualEntry({ ...manualEntry, breakMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={manualEntry.notes}
                  onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                  placeholder="Summary of work performed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  Save Timesheet Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
