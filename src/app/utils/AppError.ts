// src/utils/AppError.ts

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  

  constructor(statusCode: number, message: string, isOperational: boolean = true) {
    super(message);

    // Set properties
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly (for instanceof checks)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ===== COMMON ERROR HELPERS =====

export const createError = {
  badRequest: (message: string) => new AppError(400, message),
  unauthorized: (message: string) => new AppError(401, message),
  forbidden: (message: string) => new AppError(403, message),
  notFound: (message: string) => new AppError(404, message),
  conflict: (message: string) => new AppError(409, message),
  internal: (message: string) => new AppError(500, message),
  badGateway: (message: string) => new AppError(502, message),
};