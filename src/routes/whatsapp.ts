import { Router } from 'express'
import { WhatsAppController } from '../controllers/whatsapp.controller'
import { validateWebhookVerification } from '../middlewares/validations'

const router: Router = Router()
const whatsappController = new WhatsAppController()

// Webhook verification (GET)
router.get(
  '/webhook',
  validateWebhookVerification,
  whatsappController.verifyWebhook
)

// Receive messages (POST) - Main bot endpoint
router.post('/webhook', whatsappController.receiveMessage)

// Health check for WhatsApp service
router.get('/health', whatsappController.healthCheck)

export { router as whatsappRoutes }
