import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';
import { AuthUser } from './types.js';
import { BackendConfig, config as defaultConfig } from './config.js';
import { UnauthorizedError, ForbiddenError } from './errors.js';

export interface ITokenVerifier {
  verify(token: string): Promise<CognitoIdTokenPayload>;
}

export class CognitoAuthService {
  private verifier: ITokenVerifier | null = null;
  private config: BackendConfig;

  constructor(config: BackendConfig = defaultConfig, customVerifier?: ITokenVerifier) {
    this.config = config;
    if (customVerifier) {
      this.verifier = customVerifier;
    } else {
      this.initVerifier();
    }
  }

  private initVerifier() {
    try {
      this.verifier = CognitoJwtVerifier.create({
        userPoolId: this.config.cognitoUserPoolId,
        tokenUse: 'id',
        clientId: this.config.cognitoClientId
      });
    } catch (err) {
      console.warn('Could not initialize CognitoJwtVerifier with current config:', err);
      this.verifier = null;
    }
  }

  public extractBearerToken(authHeader?: string): string {
    if (!authHeader || !authHeader.trim()) {
      throw new UnauthorizedError('Missing Authorization header. Expected Bearer <token>.');
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1].trim()) {
      throw new UnauthorizedError('Malformed Authorization header. Format must be "Bearer <id_token>".');
    }

    return parts[1].trim();
  }

  public async authenticate(authHeader?: string): Promise<AuthUser> {
    const token = this.extractBearerToken(authHeader);

    if (!this.verifier) {
      throw new UnauthorizedError('Cognito Token Verifier is not initialized.');
    }

    try {
      // Cryptographically verifies signature via JWKS, checks iss, aud, exp, and token_use: 'id'
      const payload = await this.verifier.verify(token);

      const sub = payload.sub;
      const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
      const name =
        (typeof payload.name === 'string' && payload.name.trim()) ||
        (typeof payload['cognito:username'] === 'string' && payload['cognito:username'].trim()) ||
        (email.split('@')[0]) ||
        'CampusFix User';

      const groupsRaw = payload['cognito:groups'];
      const groups: string[] = Array.isArray(groupsRaw)
        ? groupsRaw.map(g => String(g).trim())
        : [];

      // Determine admin privileges strictly from verified Cognito group membership
      const isAdmin =
        groups.includes(this.config.cognitoAdminGroup) ||
        groups.includes('admin') ||
        groups.includes('Administrators');

      return {
        sub,
        email,
        name,
        groups,
        isAdmin
      };
    } catch (err: any) {
      const msg = err?.message || 'Token verification failed';
      throw new UnauthorizedError(`Invalid or expired Cognito ID token: ${msg}`);
    }
  }

  public requireAdmin(user: AuthUser): void {
    if (!user.isAdmin) {
      throw new ForbiddenError(
        `Administrative access required. User is not a member of the "${this.config.cognitoAdminGroup}" group.`
      );
    }
  }
}

export const defaultAuthService = new CognitoAuthService();
