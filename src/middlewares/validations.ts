import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

export const validateSendMessage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { businessId, to, message } = req.body

  if (!businessId || !to || !message) {
    logger.warn('❌ Invalid send message request: missing required fields')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'businessId, to, and message fields are required',
    })
  }

  if (
    typeof businessId !== 'string' ||
    typeof to !== 'string' ||
    typeof message !== 'string'
  ) {
    logger.warn('❌ Invalid send message request: invalid field types')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'businessId, to, and message must be strings',
    })
  }

  next()
}

export const validateWebhookVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    'hub.mode': mode,
    'hub.challenge': challenge,
    'hub.verify_token': token,
  } = req.query

  if (!mode || !challenge || !token) {
    logger.warn('❌ Invalid webhook verification request: missing parameters')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required webhook verification parameters',
    })
  }

  next()
}

export const validateBusinessConfig = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, industry, phoneNumberId } = req.body

  if (!name || !industry || !phoneNumberId) {
    logger.warn('❌ Invalid business config: missing required fields')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name, industry, and phoneNumberId are required',
    })
  }

  if (
    typeof name !== 'string' ||
    typeof industry !== 'string' ||
    typeof phoneNumberId !== 'string'
  ) {
    logger.warn('❌ Invalid business config: invalid field types')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name, industry, and phoneNumberId must be strings',
    })
  }

  next()
}

export const validateBroadcast = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { businessId, recipients, message } = req.body

  if (!businessId || !recipients || !message) {
    logger.warn('❌ Invalid broadcast request: missing required fields')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'businessId, recipients, and message are required',
    })
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    logger.warn(
      '❌ Invalid broadcast request: recipients must be a non-empty array'
    )
    return res.status(400).json({
      error: 'Bad Request',
      message: 'recipients must be a non-empty array',
    })
  }

  if (recipients.length > 100) {
    logger.warn('❌ Invalid broadcast request: too many recipients')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Maximum 100 recipients allowed per broadcast',
    })
  }

  next()
}
