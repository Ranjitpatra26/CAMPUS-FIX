import { UserManager, WebStorageStateStore, User as OidcUser } from 'oidc-client-ts';
import { User, UserRole } from '../../types';
import { IAuthService, RegisterInput } from './authService';
import { DEMO_STUDENT, DEMO_ADMIN } from '../mock-data/initialUsers';
import { authLogger } from './authLogger';
import {
  isUuidString,
  isGenericRolePlaceholder,
  formatDisplayNameFromEmail,
  getSavedCustomDisplayName
} from '../../utils/userProfile';

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectUri: string;
  scope?: string;
}

export interface CognitoLoginOptions {
  prompt?: 'login' | 'none' | 'select_account' | string;
  forceLogin?: boolean;
}

export class CognitoAuthAdapter implements IAuthService {
  private userManager: UserManager | null = null;
  private config: CognitoConfig;
  private currentUser: User | null = null;
  private callbackPromise: Promise<User | null> | null = null;
  private justCompletedCallbackUser: User | null = null;

  constructor(customConfig?: Partial<CognitoConfig>) {
    const rawRegion = customConfig?.region || import.meta.env.VITE_AWS_REGION || 'ap-southeast-2';
    const rawPoolId = customConfig?.userPoolId ?? (import.meta.env.VITE_COGNITO_USER_POOL_ID || '');
    const rawClientId = customConfig?.clientId ?? (import.meta.env.VITE_COGNITO_CLIENT_ID || '');
    const rawDomain = customConfig?.domain ?? (import.meta.env.VITE_COGNITO_DOMAIN || '');
    const rawRedirectUri =
      customConfig?.redirectUri ||
      import.meta.env.VITE_COGNITO_REDIRECT_URI ||
      'http://localhost:5173/';
    const rawScope =
      customConfig?.scope ||
      import.meta.env.VITE_COGNITO_SCOPE ||
      'openid email';

    this.config = {
      region: rawRegion.trim(),
      userPoolId: rawPoolId.trim(),
      clientId: rawClientId.trim().replace(/\s+/g, ''),
      domain: rawDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      redirectUri: rawRedirectUri.trim(),
      scope: rawScope.trim()
    };

    authLogger.logStage('INIT', {
      region: this.config.region,
      domain: this.config.domain,
      redirectUri: this.config.redirectUri,
      scope: this.config.scope,
      isConfigured: this.isCognitoConfigured()
    });

    if (this.isCognitoConfigured()) {
      this.initUserManager();
    }
  }

  public isCognitoConfigured(): boolean {
    const { userPoolId, clientId, domain } = this.config;
    return Boolean(
      userPoolId &&
      clientId &&
      domain &&
      !userPoolId.includes('example') &&
      !clientId.includes('example') &&
      !domain.includes('example') &&
      !userPoolId.includes('XXXXXXXXX') &&
      !clientId.includes('XXXXXXXXXX')
    );
  }

  public getConfig(): CognitoConfig {
    return { ...this.config };
  }

  private initUserManager() {
    try {
      const { region, userPoolId, clientId, domain, redirectUri } = this.config;
      const authority = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

      const store =
        typeof window !== 'undefined' && window.localStorage
          ? new WebStorageStateStore({ store: window.localStorage })
          : undefined;

      this.userManager = new UserManager({
        authority,
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: this.config.scope || 'openid email',
        loadUserInfo: false,
        userStore: store,
        stateStore: store,
        metadata: {
          issuer: authority,
          authorization_endpoint: `https://${domain}/oauth2/authorize`,
          token_endpoint: `https://${domain}/oauth2/token`,
          userinfo_endpoint: `https://${domain}/oauth2/userInfo`,
          end_session_endpoint: `https://${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`,
          jwks_uri: `${authority}/.well-known/jwks.json`
        }
      });
    } catch (e) {
      console.warn('Could not initialize Cognito UserManager', e);
      this.userManager = null;
    }
  }

  private cleanUrlParams() {
    if (typeof window !== 'undefined' && window.history && window.location) {
      const cleanUrl = window.location.origin + window.location.pathname;
      const title = typeof document !== 'undefined' ? document.title : '';
      window.history.replaceState({}, title, cleanUrl);
    }
  }

  private mapOidcUserToAppUser(oidcUser: OidcUser): User {
    const profile = oidcUser.profile;
    const groups = (profile['cognito:groups'] as string[]) || [];
    const role: UserRole = groups.includes('Administrators') || groups.includes('admin') ? 'admin' : 'student';

    const email = (profile.email as string) || '';

    // Determine reliable human-readable name without exposing Cognito UUIDs
    const savedName =
      getSavedCustomDisplayName(profile.sub) ||
      (email ? getSavedCustomDisplayName(email) : null);

    const rawCandidate =
      savedName ||
      (profile.name as string) ||
      [profile.given_name as string, profile.family_name as string].filter(Boolean).join(' ') ||
      (profile['custom:name'] as string) ||
      (profile['custom:full_name'] as string) ||
      (profile.nickname as string) ||
      (profile.preferred_username as string) ||
      '';

    let name: string;
    if (
      rawCandidate &&
      rawCandidate.trim().length > 0 &&
      !isUuidString(rawCandidate) &&
      rawCandidate.trim().toLowerCase() !== profile.sub.toLowerCase() &&
      !isGenericRolePlaceholder(rawCandidate)
    ) {
      name = rawCandidate.trim();
    } else if (email) {
      name = formatDisplayNameFromEmail(email, role);
    } else {
      // Sensible role-based fallback when reliable name attribute is not provided
      name = role === 'admin' ? 'Administrator' : 'Student';
    }

    const rawStudentId = (profile['custom:student_id'] as string) || (profile['studentId'] as string) || undefined;
    const studentId = rawStudentId && !isUuidString(rawStudentId) ? rawStudentId : undefined;
    const department = (profile['custom:department'] as string) || (role === 'admin' ? 'Campus Administration' : 'General Campus');

    return {
      id: profile.sub,
      name,
      email,
      role,
      studentId,
      department,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }

  async loginWithCognito(options?: CognitoLoginOptions): Promise<void> {
    if (!this.isCognitoConfigured() || !this.userManager) {
      throw new Error(
        'Amazon Cognito is not fully configured in environment variables. Please specify VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_DOMAIN.'
      );
    }

    // Ensure state is stored under the exact origin configured for Cognito callback.
    // If user accesses via http://127.0.0.1:5173, redirect to http://localhost:5173/login
    // so state and PKCE verifiers reside in the same localStorage that Cognito returns to.
    if (typeof window !== 'undefined' && window.location) {
      try {
        const expectedOrigin = new URL(this.config.redirectUri).origin;
        if (window.location.origin !== expectedOrigin) {
          window.location.href = `${expectedOrigin}${window.location.pathname}${window.location.search}`;
          return;
        }
      } catch (e) {
        // Fallback: continue
      }
    }

    const prompt = options?.prompt || (options?.forceLogin ? 'login' : undefined);

    authLogger.logStage('SSO_TRIGGER', {
      redirectUri: this.config.redirectUri,
      scope: this.config.scope || 'openid email',
      prompt
    });

    // signinRedirect automatically generates PKCE code_verifier, code_challenge (S256), and state
    await this.userManager.signinRedirect({
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope || 'openid email',
      ...(prompt ? { prompt } : {})
    });
  }

  async handleCallback(): Promise<User | null> {
    if (typeof window === 'undefined') return null;

    // Concurrency protection: if callback is already in-flight, return the existing promise
    if (this.callbackPromise) {
      return this.callbackPromise;
    }

    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hasError = params.has('error');

    if (!hasCode && !hasError) {
      return this.currentUser;
    }

    authLogger.logStage('CALLBACK_DETECTED', {
      hasCode,
      hasError,
      hasState: params.has('state')
    });

    this.callbackPromise = (async () => {
      try {
        // 1. Handle error response from Cognito
        if (hasError) {
          const errCode = params.get('error') || 'unknown_error';
          const errDesc = params.get('error_description') || 'Authentication request was not completed.';
          authLogger.logError('ERROR', `Cognito Error (${errCode}): ${errDesc}`);
          this.cleanUrlParams();
          throw new Error(`Cognito Error (${errCode}): ${errDesc}`);
        }

        // 2. Validate configuration before exchange
        if (!this.isCognitoConfigured() || !this.userManager) {
          const cfgErr = 'Missing confirmed Cognito configuration (VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_COGNITO_DOMAIN).';
          authLogger.logError('ERROR', cfgErr);
          this.cleanUrlParams();
          throw new Error(`Received authorization code from Cognito, but ${cfgErr}`);
        }

        // 3. Perform PKCE token exchange and OIDC cryptographic validation via oidc-client-ts
        authLogger.logStage('PKCE_EXCHANGE', { stateProvided: params.has('state') });
        const oidcUser = await this.userManager.signinCallback();
        if (!oidcUser || !oidcUser.id_token) {
          throw new Error('Token exchange succeeded but no valid ID token was returned by Cognito.');
        }

        this.cleanUrlParams();
        const appUser = this.mapOidcUserToAppUser(oidcUser);
        this.currentUser = appUser;
        this.justCompletedCallbackUser = appUser;
        authLogger.logStage('SESSION_RESTORED', {
          source: 'cognito',
          role: appUser.role,
          userId: appUser.id
        });
        return appUser;
      } catch (err: any) {
        authLogger.logError('ERROR', err?.message || 'Cognito callback error');
        this.cleanUrlParams();
        // Ensure user is not authenticated if verification fails
        this.currentUser = null;
        this.justCompletedCallbackUser = null;
        throw new Error(`Cognito callback verification failed: ${err?.message || 'Invalid or expired authorization code'}`);
      } finally {
        this.callbackPromise = null;
      }
    })();

    return this.callbackPromise;
  }

  public consumeCallbackUser(): User | null {
    const user = this.justCompletedCallbackUser;
    this.justCompletedCallbackUser = null;
    return user;
  }

  public isCallbackPending(): boolean {
    return Boolean(this.callbackPromise);
  }

  public hasCallbackParameters(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error');
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    if (this.userManager) {
      try {
        const oidcUser = await this.userManager.getUser();
        if (oidcUser && !oidcUser.expired) {
          const appUser = this.mapOidcUserToAppUser(oidcUser);
          this.currentUser = appUser;
          return appUser;
        } else {
          this.currentUser = null;
          return null;
        }
      } catch (e) {
        console.warn('Could not retrieve active OIDC user', e);
        this.currentUser = null;
        return null;
      }
    }

    return null;
  }

  async getIdToken(): Promise<string | null> {
    if (this.userManager) {
      try {
        const oidcUser = await this.userManager.getUser();
        if (oidcUser && !oidcUser.expired) {
          return oidcUser.id_token || null;
        }
      } catch (e) {
        console.warn('Could not retrieve active ID token', e);
      }
    }
    return null;
  }

  public getLogoutUrl(): string {
    const { domain, clientId, redirectUri } = this.config;
    return `https://${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
  }

  async logout(options?: { redirect?: boolean }): Promise<void> {
    this.currentUser = null;
    this.justCompletedCallbackUser = null;
    if (this.userManager) {
      try {
        await this.userManager.removeUser();
      } catch (e) {
        console.warn('Error removing OIDC user session', e);
      }
    }

    const shouldRedirect = options?.redirect ?? true;
    if (shouldRedirect && this.isCognitoConfigured() && typeof window !== 'undefined' && window.location) {
      const logoutUrl = this.getLogoutUrl();
      authLogger.logStage('LOGOUT', { logoutUrl });
      window.location.href = logoutUrl;
    }
  }

  async login(email: string, password?: string): Promise<User> {
    // In Cognito mode with Hosted UI, direct password login is delegated to Hosted UI
    if (this.isCognitoConfigured()) {
      await this.loginWithCognito();
      throw new Error('Redirecting to Cognito Hosted Login...');
    }
    throw new Error('Cognito authentication is not configured. Please check your environment configuration.');
  }

  async register(input: RegisterInput): Promise<User> {
    if (this.isCognitoConfigured()) {
      await this.loginWithCognito();
      throw new Error('Please register via the Cognito Hosted UI.');
    }
    throw new Error('Cognito self-registration must be performed through the Hosted UI.');
  }

  async switchDemoRole(_role: UserRole): Promise<User> {
    throw new Error('Role switching is disabled. User role is strictly derived from verified Cognito identity tokens.');
  }

  getDemoUsers(): { student: User; admin: User } {
    return {
      student: DEMO_STUDENT,
      admin: DEMO_ADMIN
    };
  }
}
