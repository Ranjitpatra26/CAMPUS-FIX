export interface BackendConfig {
  awsRegion: string;
  tableName: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cognitoAdminGroup: string;
  allowedOrigin: string;
  sesSourceEmail: string;
  adminNotificationEmail: string;
  frontendBaseUrl: string;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): BackendConfig {
  const awsRegion = env.AWS_REGION || env.VITE_AWS_REGION || 'ap-southeast-2';
  const tableName = env.TABLE_NAME || 'CampusFixComplaints';
  const cognitoUserPoolId =
    env.COGNITO_USER_POOL_ID || env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_tNhqL8tGi';
  const cognitoClientId =
    env.COGNITO_CLIENT_ID || env.VITE_COGNITO_CLIENT_ID || '4oq0kq3qljmhdu8rmbjclt94sl';
  const cognitoAdminGroup = env.COGNITO_ADMIN_GROUP || 'Administrators';
  const allowedOrigin = env.ALLOWED_ORIGIN || 'http://localhost:5173';
  const sesSourceEmail = env.SES_SOURCE_EMAIL || '';
  const adminNotificationEmail = env.ADMIN_NOTIFICATION_EMAIL || '';
  const frontendBaseUrl = env.FRONTEND_BASE_URL || '';

  return {
    awsRegion: awsRegion.trim(),
    tableName: tableName.trim(),
    cognitoUserPoolId: cognitoUserPoolId.trim(),
    cognitoClientId: cognitoClientId.trim().replace(/\s+/g, ''),
    cognitoAdminGroup: cognitoAdminGroup.trim(),
    allowedOrigin: allowedOrigin.trim(),
    sesSourceEmail: sesSourceEmail.trim(),
    adminNotificationEmail: adminNotificationEmail.trim(),
    frontendBaseUrl: frontendBaseUrl.trim()
  };
}

export const config = loadConfig();
