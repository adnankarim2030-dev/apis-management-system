import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, ArrowRight, X, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TimelineAlertModalProps {
  onNavigate: (path: string) => void;
}

interface DeadlineAlertItem {
  project: Project;
  hoursRemaining: number;
  isOverdue: boolean;
}

export const TimelineAlertModal: React.FC<TimelineAlertModalProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<DeadlineAlertItem | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkProjectDeadlines = async () => {
      try {
        const res = await api.get<Project[]>('/projects');
        const projects = res.data || [];

        const now = Date.now();
        const urgentAlerts: DeadlineAlertItem[] = [];

        for (const p of projects) {
          if (p.status === 'COMPLETED' || (p.progress && p.progress >= 100)) continue;

          const deadlineStr = (p as any).targetDeliveryDate || p.endDate || (p as any).deadline;
          if (!deadlineStr) continue;

          const deadlineTime = new Date(deadlineStr).getTime();
          const diffMs = deadlineTime - now;
          const diffHours = Math.round(diffMs / (1000 * 60 * 60));

          // If within 48 hours or overdue
          if (diffHours <= 48) {
            const isDismissed = sessionStorage.getItem(`dismissed_deadline_${p.id}`);
            if (!isDismissed) {
              urgentAlerts.push({
                project: p,
                hoursRemaining: Math.abs(diffHours),
                isOverdue: diffHours < 0,
              });
            }
          }
        }

        if (urgentAlerts.length > 0) {
          // Display the most urgent project
          urgentAlerts.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return a.hoursRemaining - b.hoursRemaining;
          });

          setActiveAlert(urgentAlerts[0]);
        }
      } catch (err) {
        console.error('Failed to check project deadlines:', err);
      }
    };

    // Check on mount and every 60 seconds
    checkProjectDeadlines();
    const interval = setInterval(checkProjectDeadlines, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!activeAlert) return null;

  const { project, hoursRemaining, isOverdue } = activeAlert;

  const handleDismiss = () => {
    sessionStorage.setItem(`dismissed_deadline_${project.id}`, 'true');
    setActiveAlert(null);
  };

  const handleReviewProject = () => {
    sessionStorage.setItem(`dismissed_deadline_${project.id}`, 'true');
    setActiveAlert(null);
    onNavigate(`/projects/${project.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-950/50 space-y-6 overflow-hidden">
        {/* Glow Effects */}
        <div className={`absolute -top-16 -right-16 w-36 h-36 ${isOverdue ? 'bg-rose-500/20' : 'bg-amber-500/20'} rounded-full blur-3xl pointer-events-none`} />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOverdue ? 'bg-rose-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOverdue ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className={`text-[11px] font-mono font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isOverdue
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {isOverdue ? 'Critical Deadline Overdue' : 'Timeline Alert: Deadline Approaching'}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Card Info */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {project.projectCode}
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">{project.name}</h3>
              {project.client && (
                <p className="text-xs text-slate-400 mt-0.5">Client: {project.client.name}</p>
              )}
            </div>

            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold font-mono shrink-0 ${
              isOverdue
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isOverdue ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>+{hoursRemaining}h Overdue</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{hoursRemaining}h Left</span>
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Completion Status</span>
              <span className="font-mono font-bold text-white">{Math.round(project.progress || 0)}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverdue
                    ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          {isOverdue
            ? '⚠️ This project has crossed its target delivery date. Please expedite pending tasks or re-align milestones immediately with team leads.'
            : '⏰ The project timeline is ending in less than 48 hours. Please review all remaining sprint deliverables and submit your updates.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleDismiss}
            className="px-5 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            Acknowledge Later
          </button>

          <button
            onClick={handleReviewProject}
            className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
              isOverdue
                ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-rose-900/30'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
            }`}
          >
            <span>Review Project Sprints</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
