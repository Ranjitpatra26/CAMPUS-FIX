import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly error: string;

  constructor(statusCode: number, error: string, message: string) {
    super(message);
    this.name = error;
    this.statusCode = statusCode;
    this.error = error;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, 'BadRequestError', message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Authentication required. Missing or invalid Bearer token.') {
    super(401, 'UnauthorizedError', message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access denied. You do not have permission to perform this action.') {
    super(403, 'ForbiddenError', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found.') {
    super(404, 'NotFoundError', message);
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message: string = 'HTTP method not allowed.') {
    super(405, 'MethodNotAllowedError', message);
  }
}

export function buildCorsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    'Access-Control-Max-Age': '86400'
  };
}

export function createJsonResponse(
  statusCode: number,
  body: unknown,
  allowedOrigin: string = '*'
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: buildCorsHeaders(allowedOrigin),
    body: JSON.stringify(body)
  };
}

export function createErrorResponse(
  error: unknown,
  allowedOrigin: string = '*'
): APIGatewayProxyResultV2 {
  if (error instanceof HttpError) {
    return createJsonResponse(
      error.statusCode,
      {
        error: error.error,
        message: error.message,
        statusCode: error.statusCode
      },
      allowedOrigin
    );
  }

  // Sanitize internal server errors - never leak stack traces or internal DB errors
  console.error('[CampusFix Lambda Internal Error]:', error);
  return createJsonResponse(
    500,
    {
      error: 'InternalServerError',
      message: 'An unexpected internal server error occurred.',
      statusCode: 500
    },
    allowedOrigin
  );
}
