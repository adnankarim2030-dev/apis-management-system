import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, X } from 'lucide-react';
import { ProjectRiskAssessment } from '../../types';

interface RiskBadgeProps {
  assessment?: ProjectRiskAssessment;
  showDetails?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ assessment, showDetails = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!assessment) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="w-3.5 h-3.5" />
        Healthy
      </span>
    );
  }

  const { riskLevel, healthScore, reasons, recommendations } = assessment;

  const styles = {
    CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
    HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
    MEDIUM: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25',
    LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
  }[riskLevel] || 'bg-slate-700 text-slate-300 border-slate-600';

  const icons = {
    CRITICAL: <ShieldAlert className="w-3.5 h-3.5" />,
    HIGH: <AlertTriangle className="w-3.5 h-3.5" />,
    MEDIUM: <Info className="w-3.5 h-3.5" />,
    LOW: <ShieldCheck className="w-3.5 h-3.5" />,
  }[riskLevel];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${styles}`}
        title="Click to view AI Project Intelligence details"
      >
        {icons}
        <span>{riskLevel === 'LOW' ? 'Healthy' : `${riskLevel} Risk`}</span>
        <span className="text-[10px] opacity-80 pl-1 font-mono">({healthScore}%)</span>
      </button>

      {/* Intelligence Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {icons}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Project Risk Intelligence
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-mono ${styles}`}>
                    {riskLevel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Algorithmic risk evaluation and schedule health</p>
              </div>
            </div>

            {/* Health Score Meter */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-300">Overall Project Health Score</span>
                <span className="text-sm font-bold font-mono text-white">{healthScore}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    healthScore > 70 ? 'bg-emerald-500' : healthScore > 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>

            {/* Itemized Reasons */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Identified Risk Factors ({reasons.length})
              </h4>
              <ul className="space-y-2">
                {reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Engine Recommendations
                </h4>
                <ul className="space-y-1.5">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-brand-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
