import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { errorHandler } from './middlewares/error-handler'
import { businessRoutes } from './routes/business'
import { whatsappRoutes } from './routes/whatsapp'
import { logger } from './utils/logger'
import { authRoutes } from './routes/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4001

// Rate limiting - more permissive for business bot
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Higher limit for bot operations
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
  },
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/auth', authRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI WhatsApp Business Bot',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
  logger.info(`🤖 AI WhatsApp Business Bot running on port ${PORT}`)
  logger.info(`📱 Webhook URL: http://localhost:${PORT}/api/whatsapp/webhook`)
  logger.info(`💼 Business API: http://localhost:${PORT}/api/business`)
  logger.info(`❤️  Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})
