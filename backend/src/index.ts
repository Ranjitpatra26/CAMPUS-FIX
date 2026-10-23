import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from './config.js';
import { defaultAuthService } from './auth.js';
import { defaultComplaintRepo } from './db.js';
import { defaultNotificationService } from './notifications.js';
import { AppRouter } from './router.js';

// Pre-warm router, token verifier, DynamoDB client, and SES client outside handler for maximum execution efficiency
const router = new AppRouter(
  config,
  defaultAuthService,
  defaultComplaintRepo,
  defaultNotificationService
);

/**
 * CampusFixBackendFunction
 * Single AWS Lambda function for CampusFix college complaint management.
 * Invocable directly via Lambda Function URLs (HTTPS) with application-level Cognito JWT verification.
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  return router.dispatch(event);
};
