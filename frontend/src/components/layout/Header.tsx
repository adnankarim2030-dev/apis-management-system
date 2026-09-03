import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Play,
  Square,
  Clock,
  UserCheck,
  LogOut,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole, Timesheet, Notification } from '../../types';
import { api } from '../../api/client';
import { useSocket } from '../../context/SocketContext';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigate }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { socket } = useSocket();

  // Active Timesheet state
  const [activeSession, setActiveSession] = useState<Timesheet | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Demo user menu
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fetch active timesheet
  const fetchActiveSession = async () => {
    try {
      const { data } = await api.get<Timesheet | null>('/timesheets/active');
      setActiveSession(data);
      if (data) {
        const start = new Date(data.startTime).getTime();
        const diff = Math.max(Math.floor((Date.now() - start) / 1000), 0);
        setElapsedSeconds(diff);
      }
    } catch (err) {
      console.error('Failed to fetch active session:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get<Notification[]>('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.meta?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchActiveSession();
    fetchNotifications();

    const interval = setInterval(fetchActiveSession, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Stopwatch ticker
  useEffect(() => {
    if (!activeSession) return;
    const ticker = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, [activeSession]);

  // Socket notification listener
  useEffect(() => {
    if (!socket) return;
    socket.on('notification_received', (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return () => {
      socket.off('notification_received');
    };
  }, [socket]);

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/timesheets/${activeSession.id}/stop`, {});
      setActiveSession(null);
      setElapsedSeconds(0);
    } catch (err) {
      console.error('Failed to stop timer:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors" />
            <span>Search anything across APIS...</span>
          </div>
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Live Timer Widget */}
        {activeSession ? (
          <div className="flex items-center gap-2.5 bg-brand-500/10 border border-brand-500/30 px-3 py-1.5 rounded-xl animate-pulse">
            <div className="flex items-center gap-1.5 text-brand-400">
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-mono text-xs font-bold">{formatTimer(elapsedSeconds)}</span>
            </div>
            <span className="hidden md:inline text-xs text-slate-300 max-w-[140px] truncate">
              {activeSession.task?.title || activeSession.project?.name || 'Active session'}
            </span>
            <button
              onClick={handleStopSession}
              className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-md transition-colors"
              title="Stop timer and log hours"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('/timesheets')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Start Timer</span>
          </button>
        )}

        {/* 1-Click Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden md:inline font-mono uppercase text-[11px] text-brand-300">{user?.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                Switch Demo Role / Perspective
              </div>
              {(Object.keys(DEMO_USERS) as UserRole[]).map((roleKey) => {
                const item = DEMO_USERS[roleKey];
                const isActive = user?.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    onClick={() => {
                      switchDemoRole(roleKey);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      isActive ? 'bg-brand-500/20 text-brand-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-400">{roleKey}</span>
                      <span className="truncate">{item.name.split(' ')[0]}</span>
                    </div>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/40">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) {
                          onNavigate(n.link);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-brand-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-400 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-200">{user?.name}</div>
              <div className="text-[10px] text-slate-400">{user?.designation || user?.role}</div>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-bold text-white">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="text-[10px] font-mono text-brand-400 uppercase mt-0.5">{user?.role}</div>
              </div>
              <button
                onClick={() => {
                  onNavigate('/team');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
