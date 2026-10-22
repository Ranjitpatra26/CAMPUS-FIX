import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { authService, RegisterInput } from '../services/auth/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  callbackError: string | null;
  login: (email: string, password?: string) => Promise<User>;
  loginWithCognito: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  isCognitoConfigured: boolean;
  isMockAuthEnabled: boolean;
  authSource: 'cognito' | 'mock' | 'none';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authSource, setAuthSource] = useState<'cognito' | 'mock' | 'none'>('none');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const callbackHandledRef = useRef<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // 1. Check if returning from Cognito redirect with ?code= or ?error=
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.has('code') || params.has('error')) {
            if (!callbackHandledRef.current) {
              callbackHandledRef.current = true;
              try {
                const callbackUser = await authService.handleCallback?.();
                if (callbackUser && isMounted) {
                  setUser(callbackUser);
                  setAuthSource('cognito');
                  setCallbackError(null);
                  navigate(callbackUser.role === 'admin' ? '/admin' : '/student', { replace: true });
                  return;
                }
              } catch (cbErr: any) {
                console.error('Cognito callback error', cbErr);
                if (isMounted) {
                  setCallbackError(cbErr?.message || 'Cognito authentication callback failed.');
                  setUser(null);
                  setAuthSource('none');
                  navigate('/login', { replace: true });
                }
                return;
              }
            } else {
              // Duplicate execution guard (e.g. StrictMode remount): restore user if already verified
              const current = await authService.getCurrentUser();
              const source = await authService.getAuthSource();
              if (current && isMounted) {
                setUser(current);
                setAuthSource(source);
                return;
              }
            }
          }
        }

        // 2. Otherwise restore existing active session
        const current = await authService.getCurrentUser();
        const source = await authService.getAuthSource();
        if (isMounted) {
          setUser(current);
          setAuthSource(current ? source : 'none');
        }
      } catch (err) {
        console.error('Session error', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      setAuthSource('mock');
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCognito = async () => {
    if (authService.loginWithCognito) {
      await authService.loginWithCognito();
    } else {
      throw new Error('Cognito authentication is not supported by current adapter.');
    }
  };

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(input);
      setUser(newUser);
      setAuthSource('mock');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setAuthSource('none');
      setCallbackError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const switchedUser = await authService.switchDemoRole(targetRole);
      setUser(switchedUser);
      setAuthSource('mock');
    } finally {
      setIsLoading(false);
    }
  };

  const role: UserRole = user?.role || 'student';
  const isCognitoConfigured = Boolean(authService.isCognitoConfigured?.());
  const isMockAuthEnabled = Boolean(authService.isMockAuthEnabled?.());

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        callbackError,
        login,
        loginWithCognito,
        register,
        logout,
        switchRole,
        isCognitoConfigured,
        isMockAuthEnabled,
        authSource
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
