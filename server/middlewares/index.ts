export * from './auth.middleware';
export * from './validation.middleware';
export * from './error.middleware';
export * from './logging.middleware';

// Make sure we export the correct catchAsync that calls next(err)
export { catchAsync } from './error.middleware';