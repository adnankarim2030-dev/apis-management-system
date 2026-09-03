import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Clock,
  Users,
  Building,
  FileText,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Activity,
  Shield,
  Layers,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user } = useAuth();
  const isExecutive = ['CEO', 'ADMIN', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'].includes(user?.role || '');

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        ...(isExecutive
          ? [
              {
                name: 'Executive Intelligence',
                path: '/ceo-dashboard',
                icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                badge: 'CEO',
                badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              },
            ]
          : []),
        {
          name: 'Staff Workbench',
          path: '/staff-dashboard',
          icon: <LayoutDashboard className="w-4 h-4 text-brand-400" />,
        },
      ],
    },
    {
      title: 'PROJECT DELIVERY',
      items: [
        {
          name: 'Projects Hub',
          path: '/projects',
          icon: <FolderKanban className="w-4 h-4 text-blue-400" />,
        },
        {
          name: 'Tasks & Workflow',
          path: '/tasks',
          icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
        },
        {
          name: 'Timesheets & Tracking',
          path: '/timesheets',
          icon: <Clock className="w-4 h-4 text-cyan-400" />,
        },
        {
          name: 'Approvals Center',
          path: '/approvals',
          icon: <CheckCircle className="w-4 h-4 text-purple-400" />,
        },
      ],
    },
    {
      title: 'ORGANIZATION',
      items: [
        {
          name: 'Team & Workload',
          path: '/team',
          icon: <Users className="w-4 h-4 text-indigo-400" />,
        },
        {
          name: 'Client Directory',
          path: '/clients',
          icon: <Building className="w-4 h-4 text-orange-400" />,
        },
        {
          name: 'Document Vault',
          path: '/documents',
          icon: <FileText className="w-4 h-4 text-teal-400" />,
        },
      ],
    },
    {
      title: 'COMMUNICATIONS & INSIGHTS',
      items: [
        {
          name: 'Chat & Broadcasts',
          path: '/messages',
          icon: <MessageSquare className="w-4 h-4 text-pink-400" />,
        },
        ...(isExecutive
          ? [
              {
                name: 'Reports & Analytics',
                path: '/reports',
                icon: <BarChart3 className="w-4 h-4 text-yellow-400" />,
              },
            ]
          : []),
        {
          name: 'Activity Audit Log',
          path: '/activity-logs',
          icon: <Activity className="w-4 h-4 text-slate-400" />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/90 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(isExecutive ? '/ceo-dashboard' : '/staff-dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                APIS <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">PRO</span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Executive & Staff System
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        onNavigate(item.path);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600/15 text-brand-300 font-semibold border border-brand-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] font-mono text-brand-400 truncate">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
