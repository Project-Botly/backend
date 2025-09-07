import { Router } from 'express'
import { WhatsAppController } from '../controllers/whatsapp.controller'
import { validateWebhookVerification } from '../middlewares/validations'
import { WebhookVerificationQuery } from '../types/whatsapp.types'

const router: Router = Router()
const whatsappController = new WhatsAppController()

// Webhook verification
router.get<{}, {}, {}, WebhookVerificationQuery | any>(
  '/webhook',
  validateWebhookVerification,
  whatsappController.verifyWebhook
)

// Receive messages - Main bot endpoint
router.post('/webhook', whatsappController.receiveMessage)

// Health check for WhatsApp service
router.get('/health', whatsappController.healthCheck)

export { router as whatsappRoutes }
