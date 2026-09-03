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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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
    } catch (err) {
      console.error('Failed to load user profile:', err);
      localStorage.removeItem('apis_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password: passwordPlain,
    });
    localStorage.setItem('apis_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('apis_token');
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
