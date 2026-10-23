import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { authService, RegisterInput } from '../services/auth/authService';
import { CognitoLoginOptions } from '../services/auth/cognitoAuthAdapter';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  callbackError: string | null;
  login: (email: string, password?: string) => Promise<User>;
  loginWithCognito: (options?: CognitoLoginOptions) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: (options?: { redirect?: boolean }) => Promise<void>;
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
  const isMountedRef = useRef<boolean>(true);
  const hasNavigatedRef = useRef<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    isMountedRef.current = true;

    const checkSession = async () => {
      try {
        // 1. Check if a callback just finished in another mount/tick
        const justHandledUser = authService.consumeCallbackUser?.();
        if (justHandledUser) {
          if (isMountedRef.current) {
            setUser(justHandledUser);
            setAuthSource('cognito');
            setCallbackError(null);
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              navigate(justHandledUser.role === 'admin' ? '/admin' : '/student', { replace: true });
            }
          }
          return;
        }

        // 2. Check if returning from Cognito redirect with ?code= or ?error=, or if callback is in-flight
        const hasParams = authService.hasCallbackParameters?.() ?? (
          typeof window !== 'undefined' &&
          (new URLSearchParams(window.location.search).has('code') ||
           new URLSearchParams(window.location.search).has('error'))
        );
        const isPending = authService.isCallbackPending?.() ?? false;

        if (hasParams || isPending) {
          try {
            const callbackUser = await authService.handleCallback?.();
            if (callbackUser && isMountedRef.current) {
              setUser(callbackUser);
              setAuthSource('cognito');
              setCallbackError(null);
              if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                navigate(callbackUser.role === 'admin' ? '/admin' : '/student', { replace: true });
              }
              return;
            }
          } catch (cbErr: any) {
            console.error('Cognito callback error', cbErr);
            if (isMountedRef.current) {
              setCallbackError(cbErr?.message || 'Cognito authentication callback failed.');
              setUser(null);
              setAuthSource('none');
              if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                navigate('/login', { replace: true });
              }
            }
            return;
          }
        }

        // 3. Otherwise restore existing active session (e.g. page refresh)
        const current = await authService.getCurrentUser();
        const source = (await authService.getAuthSource?.()) ?? (current ? 'cognito' : 'none');
        if (isMountedRef.current) {
          setUser(current);
          setAuthSource(current ? source : 'none');
        }
      } catch (err) {
        console.error('Session error', err);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMountedRef.current = false;
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

  const loginWithCognito = async (options?: CognitoLoginOptions) => {
    if (authService.loginWithCognito) {
      await authService.loginWithCognito(options);
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

  const logout = async (options?: { redirect?: boolean }) => {
    setIsLoading(true);
    try {
      await authService.logout(options);
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
