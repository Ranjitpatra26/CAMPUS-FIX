/**
 * Safe Authentication Diagnostics Logger
 *
 * Rules:
 * - NEVER log tokens (access_token, id_token, refresh_token)
 * - NEVER log authorization codes (?code=...)
 * - NEVER log PKCE verifiers or challenges
 * - NEVER log passwords or raw credentials
 * - NEVER log full URLs with query parameters
 * - ONLY log sanitized stage names, origins, and error descriptions
 */

export type AuthStage =
  | 'INIT'
  | 'SSO_TRIGGER'
  | 'CALLBACK_DETECTED'
  | 'PKCE_EXCHANGE'
  | 'SESSION_RESTORED'
  | 'LOGOUT'
  | 'ERROR';

export const authLogger = {
  logStage(stage: AuthStage, details?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const cleanDetails: Record<string, unknown> = details ? { ...details } : {};

    // Strictly redact any sensitive fields if accidentally included
    for (const key of Object.keys(cleanDetails)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('token') ||
        lower.includes('code') ||
        lower.includes('verifier') ||
        lower.includes('challenge') ||
        lower.includes('password') ||
        lower.includes('secret')
      ) {
        cleanDetails[key] = '[REDACTED]';
      }
    }

    const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
    if (!isTest) {
      console.log(`[CampusFix Auth][${stage}] ${timestamp}`, cleanDetails);
    }
  },

  logError(stage: AuthStage, message: string) {
    const timestamp = new Date().toISOString();
    // Sanitize any URL query parameters from error message if present
    const sanitized = message.replace(/(code|state|token)=[^&\s]+/gi, '$1=[REDACTED]');
    const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
    if (!isTest) {
      console.error(`[CampusFix Auth Error][${stage}] ${timestamp}: ${sanitized}`);
    }
  }
};
