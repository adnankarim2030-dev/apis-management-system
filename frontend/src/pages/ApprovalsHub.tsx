import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FolderKanban,
  CheckSquare,
  FileText,
  RefreshCw,
  Send,
} from 'lucide-react';
import { api } from '../api/client';
import { Approval } from '../types';
import { useAuth } from '../context/AuthContext';

export const ApprovalsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isManager = ['CEO', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD', 'ACCOUNT_MANAGER'].includes(
    user?.role || ''
  );

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [isLoading, setIsLoading] = useState(true);

  // Decision Modal
  const [activeApproval, setActiveApproval] = useState<Approval | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'>('APPROVED');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Approval[]>('/approvals', {
        status: statusFilter || undefined,
      });
      setApprovals(res.data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApproval) return;

    try {
      setIsSubmitting(true);
      await api.post(`/approvals/${activeApproval.id}/decide`, {
        decision: decisionType,
        comments,
      });
      setActiveApproval(null);
      setComments('');
      fetchApprovals();
    } catch (err: any) {
      alert(err.message || 'Decision failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'PROJECT':
        return <FolderKanban className="w-5 h-5 text-brand-400" />;
      case 'TASK':
        return <CheckSquare className="w-5 h-5 text-emerald-400" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-teal-400" />;
      default:
        return <Clock className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckCircle className="w-6 h-6 text-purple-400" />
            Approvals & Governance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-tier review workflow across tasks, timesheets, deliverables, and project sign-offs
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
        {[
          { id: 'SUBMITTED', label: 'Pending Review', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
          { id: 'APPROVED', label: 'Approved', icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> },
          { id: 'REVISION_REQUIRED', label: 'Revisions', icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> },
          { id: 'REJECTED', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approvals Cards / List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No requests under {statusFilter.replace('_', ' ')}</h3>
          <p className="text-xs text-slate-400 mt-1">All incoming workflow items have been processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((appr) => (
            <div
              key={appr.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    {getEntityIcon(appr.entityType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        {appr.entityType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Submitted: {new Date(appr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">
                      {appr.project?.name || appr.task?.title || appr.document?.title || `${appr.entityType} Review`}
                    </h3>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border self-start sm:self-auto ${
                    appr.status === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : appr.status === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : appr.status === 'REVISION_REQUIRED'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {appr.status.replace('_', ' ')}
                </span>
              </div>

              {/* Requester & Notes */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={appr.requester?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60'}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-slate-300">
                    Requested by: <strong className="text-white">{appr.requester?.name}</strong>
                  </span>
                </div>

                {appr.comments && (
                  <div className="text-slate-400 italic">"{appr.comments}"</div>
                )}
              </div>

              {/* Manager Actions */}
              {isManager && appr.status === 'SUBMITTED' && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setActiveApproval(appr);
                      setDecisionType('APPROVED');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setActiveApproval(appr);
                      setDecisionType('REVISION_REQUIRED');
                    }}
                    className="px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => {
                      setActiveApproval(appr);
                      setDecisionType('REJECTED');
                    }}
                    className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {activeApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h2 className="text-base font-bold text-white">
              Confirm Decision: <span className="font-mono text-brand-400">{decisionType.replace('_', ' ')}</span>
            </h2>

            <form onSubmit={handleDecision} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Decision Comments / Feedback</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide rationale or instructions for the team..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveApproval(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
