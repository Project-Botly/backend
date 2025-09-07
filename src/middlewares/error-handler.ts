import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('💥 Unhandled error:', error)

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
  })
}
