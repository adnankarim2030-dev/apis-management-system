import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordPlain: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS: Record<UserRole, { email: string; label: string; name: string; avatar: string }> = {
  CEO: { email: 'khurram@apis.com', label: 'Chief Executive Officer', name: 'Khurram Jaffrani', avatar: '/avatars/khurram_jaffrani.png' },
  ADMIN: { email: 'khurram@apis.com', label: 'Chief Executive Officer', name: 'Khurram Jaffrani', avatar: '/avatars/khurram_jaffrani.png' },
  DEPARTMENT_HEAD: { email: 'naeem@apis.com', label: 'Head Of Media Buying & Planning', name: 'Naeem Ahmed', avatar: '/avatars/naeem_ahmed.png' },
  ACCOUNT_MANAGER: { email: 'kashif@apis.com', label: 'Manager Business Development', name: 'Kashif Aghani', avatar: '/avatars/kashif_aghani.png' },
  STAFF: { email: 'musfira@apis.com', label: 'Client Service & Operations Executive', name: 'Syeda Musfira', avatar: '/avatars/syeda_musfira.png' },
  PROJECT_MANAGER: { email: 'adnan@apis.com', label: 'Creative Manager (AI)', name: 'Adnan Karim', avatar: '/avatars/adnan_karim.png' },
  VIEWER: { email: 'abeel@apis.com', label: 'Head Of Design & Digital', name: 'Syed Abeel Ahmed', avatar: '/avatars/syed_abeel_ahmed.png' },
};

export const VERIFIED_PROFILES: Record<string, User> = {
  'khurram@apis.com': {
    id: '80aa87f2-5adf-4472-93a4-c55ed533fa70',
    employeeId: 'EMP-0001',
    name: 'Khurram Jaffrani',
    email: 'khurram@apis.com',
    role: 'CEO',
    designation: 'Chief Executive Officer',
    phone: '+92 300 9999888',
    avatarUrl: '/avatars/khurram_jaffrani.png',
    department: { id: '0c9d3688-10ec-44ab-b810-90077d79298a', name: 'Executive Leadership' },
    team: null,
    status: 'ACTIVE',
    joiningDate: '2026-09-03T06:05:58.799Z',
  },
  'naeem@apis.com': {
    id: '93948248-612e-4571-8692-ab3017d33c7b',
    employeeId: 'EMP-0002',
    name: 'Naeem Ahmed',
    email: 'naeem@apis.com',
    role: 'DEPARTMENT_HEAD',
    designation: 'Head Of Media Buying & Planning',
    phone: '+92 300 1234567',
    avatarUrl: '/avatars/naeem_ahmed.png',
    department: { id: 'dept-ops', name: 'Operations & Media' },
    team: { id: 'team-ops', name: 'Media Operations' },
    status: 'ACTIVE',
    joiningDate: '2026-09-03T06:05:58.799Z',
  },
  'kashif@apis.com': {
    id: 'fc031398-8deb-4c3d-9859-25766ab86625',
    employeeId: 'EMP-0003',
    name: 'Kashif Aghani',
    email: 'kashif@apis.com',
    role: 'ACCOUNT_MANAGER',
    designation: 'Manager Business Development',
    phone: '+92 321 9876543',
    avatarUrl: '/avatars/kashif_aghani.png',
    department: { id: 'dept-acc', name: 'Client Accounts & Strategy' },
    team: { id: 'team-acc', name: 'Enterprise Accounts' },
    status: 'ACTIVE',
    joiningDate: '2026-09-03T06:05:58.799Z',
  },
  'musfira@apis.com': {
    id: '537325ac-7e45-4c88-8455-afbd375308a8',
    employeeId: 'EMP-0004',
    name: 'Syeda Musfira',
    email: 'musfira@apis.com',
    role: 'STAFF',
    designation: 'Client Service & Operations Executive',
    phone: '+92 333 4567890',
    avatarUrl: '/avatars/syeda_musfira.png',
    department: { id: 'dept-acc', name: 'Client Accounts & Strategy' },
    team: { id: 'team-acc', name: 'Enterprise Accounts' },
    status: 'ACTIVE',
    joiningDate: '2026-09-03T06:05:58.799Z',
  },
  'abeel@apis.com': {
    id: '5b8866cc-04db-4791-9d17-82d76b01f9eb',
    employeeId: 'EMP-0005',
    name: 'Syed Abeel Ahmed',
    email: 'abeel@apis.com',
    role: 'DEPARTMENT_HEAD',
    designation: 'Head Of Design & Digital',
    phone: '+92 345 6789012',
    avatarUrl: '/avatars/syed_abeel_ahmed.png',
    department: { id: 'dept-prd', name: 'Product & Design' },
    team: { id: 'team-prd', name: 'Product Design Studio' },
    status: 'ACTIVE',
    joiningDate: '2026-09-03T06:05:58.799Z',
  },
  'adnan@apis.com': {
    id: 'af3ee2de-7843-47c5-97f1-ed7552ff3e26',
    employeeId: 'EMP-0006',
    name: 'Adnan Karim',
    email: 'adnan@apis.com',
    role: 'PROJECT_MANAGER',
    designation: 'Creative Manager (AI)',
    phone: '+92 312 3456789',
    avatarUrl: '/avatars/adnan_karim.png',
    department: { id: 'dept-prd', name: 'Product & Design' },
    team: { id: 'team-prd', name: 'Product Design Studio' },
    status: 'ACTIVE',
    joiningDate: '2026-09-03T06:05:58.799Z',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('apis_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('apis_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      if (!localStorage.getItem('apis_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const { data } = await api.get<User>('/auth/profile');
      setUser(data);
      localStorage.setItem('apis_user', JSON.stringify(data));
    } catch (err) {
      // If server unreachable, check if we have cached user
      const cachedUser = localStorage.getItem('apis_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
        email: cleanEmail,
        password: passwordPlain,
      });
      localStorage.setItem('apis_token', data.token);
      localStorage.setItem('apis_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (apiErr: any) {
      // Fallback verification for demo user accounts
      const fallbackUser = VERIFIED_PROFILES[cleanEmail];
      if (fallbackUser && passwordPlain === 'password123') {
        const mockToken = `apis_session_${fallbackUser.id}_${Date.now()}`;
        localStorage.setItem('apis_token', mockToken);
        localStorage.setItem('apis_user', JSON.stringify(fallbackUser));
        setToken(mockToken);
        setUser(fallbackUser);
        return;
      }
      throw apiErr;
    }
  };

  const logout = () => {
    localStorage.removeItem('apis_token');
    localStorage.removeItem('apis_user');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const demoInfo = DEMO_USERS[role];
    if (demoInfo) {
      await login(demoInfo.email, 'password123');
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'CEO' || user.role === 'ADMIN') return true;
    return roles.includes(user.role as UserRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoRole,
        hasRole,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
