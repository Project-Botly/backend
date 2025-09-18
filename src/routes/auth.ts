import { Router } from 'express'
import { BusinessController } from '../controllers/business.controller'

const router: Router = Router()
const businessController = new BusinessController()

router.post('/signup', businessController.configureBusiness)

export { router as authRoutes }
