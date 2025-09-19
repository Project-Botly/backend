import { Request, Response } from 'express'
import { BusinessService } from '../services/business.service'
import { ConversationService } from '../services/conversation.service'
import { WhatsAppService } from '../services/whatsapp.service'
import {
  BroadcastRequest,
  BusinessConfig,
  SendMessageRequest,
} from '../types/business.types'
import { logger } from '../utils/logger'
import { SignupPayload } from '../types/auth.types'
import { MetaService } from '../services/meta.service'

export class BusinessController {
  private businessService: BusinessService
  private whatsappService: WhatsAppService
  private conversationService: ConversationService
  private metaService: MetaService

  constructor() {
    this.businessService = new BusinessService()
    this.whatsappService = new WhatsAppService()
    this.conversationService = new ConversationService()
    this.metaService = new MetaService()
  }

  configureBusiness = async (
    req: Request<{}, {}, SignupPayload>,
    res: Response
  ) => {
    const { code } = req.body
    try {
      logger.info('💼 Getting Meta credentials for business')
      const cred = await this.metaService.getCredentials(code)

      const businessConfig = await this.businessService.createBusiness({
        ...cred,
        ...req.body,
      })

      res.status(201).json({
        status: 'success',
        data: businessConfig,
        message: 'Business configured successfully',
      })
    } catch (err) {
      logger.error('❌ Error configuring business:', err)
      res.status(500).json({
        status: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to configure business',
      })
    }
  }

  getBusinessConfig = async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params
      const config = await this.businessService.getBusinessById(businessId)

      if (!config) {
        return res.status(404).json({
          status: 'error',
          message: 'Business configuration not found',
        })
      }

      res.json({
        status: 'success',
        data: config,
      })
    } catch (error) {
      logger.error('❌ Error fetching business config:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch business configuration',
      })
    }
  }

  updateBusinessConfig = async (
    req: Request<{ businessId: string }, {}, BusinessConfig>,
    res: Response
  ) => {
    try {
      const { businessId } = req.params
      const updatedConfig = await this.businessService.updateBusiness(
        businessId,
        req.body
      )

      res.json({
        status: 'success',
        data: updatedConfig,
        message: 'Business configuration updated',
      })
    } catch (error) {
      logger.error('❌ Error updating business config:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update business configuration',
      })
    }
  }

  sendMessage = async (
    req: Request<{}, {}, SendMessageRequest>,
    res: Response
  ) => {
    try {
      const { businessId, to, message, type = 'text' } = req.body

      // Verify business exists
      const business = await this.businessService.getBusinessById(businessId)
      if (!business) {
        return res.status(404).json({
          status: 'error',
          message: 'Business not found',
        })
      }

      // Send message
      const result = await this.whatsappService.sendMessage({
        to,
        message,
        type,
      })

      // Store in conversation history
      await this.conversationService.storeMessage({
        messageId: result.messages[0].id,
        businessId,
        clientPhone: to,
        direction: 'outbound',
        type,
        content: message,
        timestamp: new Date(),
        status: 'sent',
      })

      logger.info(`📤 Manual message sent from business ${businessId} to ${to}`)

      res.json({
        status: 'success',
        data: result,
        message: 'Message sent successfully',
      })
    } catch (error) {
      logger.error('❌ Error sending message:', error)
      res.status(500).json({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      })
    }
  }

  broadcastMessage = async (
    req: Request<{}, {}, BroadcastRequest>,
    res: Response
  ) => {
    try {
      const { businessId, recipients, message, type = 'text' } = req.body

      const businessConfig = await this.businessService.getBusinessById(
        businessId
      )
      if (!businessConfig) {
        return res.status(404).json({
          status: 'error',
          message: 'Business not found',
        })
      }

      const results = []
      const errors = []

      for (const recipient of recipients) {
        try {
          const result = await this.whatsappService.sendMessage({
            to: recipient,
            message,
            type,
          })

          results.push({
            recipient,
            success: true,
            messageId: result.messages[0].id,
          })

          // Store in conversation history
          await this.conversationService.storeMessage({
            messageId: result.messages[0].id,
            businessId,
            clientPhone: recipient,
            direction: 'outbound',
            type,
            content: message,
            timestamp: new Date(),
            status: 'sent',
          })
        } catch (error) {
          errors.push({
            recipient,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      logger.info(
        `📢 Broadcast sent from business ${businessId} to ${recipients.length} recipients`
      )

      res.json({
        status: 'success',
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: recipients.length,
            successful: results.length,
            failed: errors.length,
          },
        },
      })
    } catch (error) {
      logger.error('❌ Error broadcasting message:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to broadcast message',
      })
    }
  }

  getAnalytics = async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params
      const analytics = await this.conversationService.getBusinessAnalytics(
        businessId
      )

      res.json({
        status: 'success',
        data: analytics,
      })
    } catch (error) {
      logger.error('❌ Error fetching analytics:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch analytics',
      })
    }
  }

  getConversations = async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params
      const { page = 1, limit = 20, clientPhone } = req.query

      const conversations =
        await this.conversationService.getBusinessConversations(businessId, {
          page: Number(page),
          limit: Number(limit),
          clientPhone: clientPhone as string,
        })

      res.json({
        status: 'success',
        data: conversations,
      })
    } catch (error) {
      logger.error('❌ Error fetching conversations:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch conversations',
      })
    }
  }

  getAllBusinesses = async (req: Request, res: Response) => {
    try {
      const results = await this.businessService.getAllBusinesses()
      res.json({
        status: 'success',
        results,
      })
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch businesses',
      })
    }
  }
}
