import { Router } from 'express'
import { BusinessController } from '../controllers/business.controller'
import {
  validateBroadcast,
  validateBusinessConfig,
  validateSendMessage,
} from '../middlewares/validations'

const router: Router = Router()
const businessController = new BusinessController()

router.get('/all', businessController.getAllBusinesses)

// Business configuration
router.post(
  '/configure',
  validateBusinessConfig,
  businessController.configureBusiness
)
router.get('/configure/:businessId', businessController.getBusinessConfig)
router.put(
  '/configure/:businessId',
  validateBusinessConfig,
  businessController.updateBusinessConfig
)

// Manual message sending
router.post(
  '/send-message',
  validateSendMessage,
  businessController.sendMessage
)

// Broadcast messages
router.post(
  '/broadcast',
  validateBroadcast,
  businessController.broadcastMessage
)

// Analytics and insights
router.get('/analytics/:businessId', businessController.getAnalytics)
router.get('/conversations/:businessId', businessController.getConversations)

export { router as businessRoutes }
