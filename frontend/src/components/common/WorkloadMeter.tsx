import React from 'react';
import { Activity, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface WorkloadMeterProps {
  percentage: number;
  status: 'AVAILABLE' | 'HEALTHY' | 'OVERLOADED';
  compact?: boolean;
}

export const WorkloadMeter: React.FC<WorkloadMeterProps> = ({ percentage, status, compact = false }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'OVERLOADED':
        return {
          bar: 'bg-rose-500',
          badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: <AlertOctagon className="w-3.5 h-3.5" />,
          label: 'Overloaded',
        };
      case 'AVAILABLE':
        return {
          bar: 'bg-cyan-500',
          badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Available Capacity',
        };
      default:
        return {
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <Activity className="w-3.5 h-3.5" />,
          label: 'Balanced Workload',
        };
    }
  };

  const info = getStatusColor();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${info.bar}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-xs font-mono font-medium text-slate-300">{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${info.badge}`}>
          {info.icon}
          {info.label}
        </span>
        <span className="font-mono font-bold text-white">{percentage}% Capacity</span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${info.bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
