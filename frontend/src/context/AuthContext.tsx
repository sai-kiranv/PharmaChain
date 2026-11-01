import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AdminUser {
  username: string;
  role: string;
  name: string;
  email: string;
  privilege: string;
  loginTime: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pharmachain_admin_auth';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as AdminUser;
        if (parsed && parsed.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to read auth state from storage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (usernameInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    // Brief realistic verification delay for authentic feel
    await new Promise((resolve) => setTimeout(resolve, 450));

    const trimmedUser = usernameInput.trim().toLowerCase();

    if (trimmedUser === ADMIN_USERNAME.toLowerCase() && passwordInput === ADMIN_PASSWORD) {
      const adminSession: AdminUser = {
        username: 'admin',
        role: 'System Administrator',
        name: 'Admin',
        email: 'admin@pharmachain.internal',
        privilege: 'Oracle DBA • SYSTEM',
        loginTime: new Date().toISOString()
      };

      setUser(adminSession);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminSession));
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid username or password. Access denied.'
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
