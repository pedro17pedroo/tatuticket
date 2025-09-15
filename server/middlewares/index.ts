export * from './auth.middleware';
export * from './validation.middleware';
export * from './logging.middleware';

// Export error handling components explicitly to avoid conflicts
export { errorHandler, notFoundHandler, AppError, catchAsync } from './error.middleware';