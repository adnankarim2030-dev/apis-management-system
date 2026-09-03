import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { CEODashboard } from './pages/CEODashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { ProjectsHub } from './pages/ProjectsHub';
import { ProjectDetail } from './pages/ProjectDetail';
import { TasksHub } from './pages/TasksHub';
import { TimesheetsHub } from './pages/TimesheetsHub';
import { TeamHub } from './pages/TeamHub';
import { ClientsHub } from './pages/ClientsHub';
import { DocumentsHub } from './pages/DocumentsHub';
import { ApprovalsHub } from './pages/ApprovalsHub';
import { MessagesHub } from './pages/MessagesHub';
import { ReportsHub } from './pages/ReportsHub';
import { ActivityLogsHub } from './pages/ActivityLogsHub';
import { LoginPage } from './pages/LoginPage';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  // Handle browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          <div className="text-sm font-semibold text-slate-300">Initializing APIS System...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Determine initial default route for CEO vs Staff
  const isExecutive = ['CEO', 'ADMIN', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'].includes(user?.role || '');
  const activePath = currentPath === '/' ? (isExecutive ? '/ceo-dashboard' : '/staff-dashboard') : currentPath;

  // Route matching
  const renderContent = () => {
    if (activePath.startsWith('/projects/')) {
      const projectId = activePath.replace('/projects/', '');
      return <ProjectDetail projectId={projectId} onNavigate={navigate} />;
    }

    switch (activePath) {
      case '/ceo-dashboard':
        return <CEODashboard onNavigate={navigate} />;
      case '/staff-dashboard':
        return <StaffDashboard onNavigate={navigate} />;
      case '/projects':
        return <ProjectsHub onNavigate={navigate} />;
      case '/tasks':
        return <TasksHub onNavigate={navigate} />;
      case '/timesheets':
        return <TimesheetsHub onNavigate={navigate} />;
      case '/team':
        return <TeamHub onNavigate={navigate} />;
      case '/clients':
        return <ClientsHub onNavigate={navigate} />;
      case '/documents':
        return <DocumentsHub onNavigate={navigate} />;
      case '/approvals':
        return <ApprovalsHub onNavigate={navigate} />;
      case '/messages':
      case '/announcements':
        return <MessagesHub onNavigate={navigate} />;
      case '/reports':
        return <ReportsHub onNavigate={navigate} />;
      case '/activity-logs':
        return <ActivityLogsHub onNavigate={navigate} />;
      default:
        return isExecutive ? <CEODashboard onNavigate={navigate} /> : <StaffDashboard onNavigate={navigate} />;
    }
  };

  return (
    <AppLayout currentPath={activePath} onNavigate={navigate}>
      {renderContent()}
    </AppLayout>
  );
};
