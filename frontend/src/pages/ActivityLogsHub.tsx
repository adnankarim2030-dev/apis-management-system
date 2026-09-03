import React, { useEffect, useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle,
  Users,
  Megaphone,
} from 'lucide-react';
import { api } from '../api/client';
import { ActivityLog } from '../types';

export const ActivityLogsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<ActivityLog[]>('/activity-logs', {
        entity: entityFilter || undefined,
        limit: 50,
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const getActionIcon = (entity: string) => {
    switch (entity) {
      case 'PROJECT':
        return <FolderKanban className="w-4 h-4 text-brand-400" />;
      case 'TASK':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'TIMESHEET':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'APPROVAL':
        return <CheckCircle className="w-4 h-4 text-purple-400" />;
      case 'USER':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-slate-400" />
            Organizational Audit Stream
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-resistant activity logs recording authentication, project mutations, task transitions, and approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Entities</option>
            <option value="PROJECT">Project Events</option>
            <option value="TASK">Task Events</option>
            <option value="TIMESHEET">Timesheet Events</option>
            <option value="APPROVAL">Approval Events</option>
            <option value="USER">User Events</option>
            <option value="ANNOUNCEMENT">Announcement Events</option>
          </select>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No activity logged matching filter.</div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              let parsedMeta: any = null;
              if (log.metadata) {
                try {
                  parsedMeta = JSON.parse(log.metadata);
                } catch {
                  parsedMeta = { raw: log.metadata };
                }
              }

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 mt-0.5">
                    {getActionIcon(log.entity)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {log.user?.name || 'System / Automated Engine'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                          {log.action}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {parsedMeta && (
                      <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-850">
                        {Object.entries(parsedMeta).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            <strong className="text-slate-300">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
