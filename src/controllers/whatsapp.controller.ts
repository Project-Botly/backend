import { Request, Response } from 'express'
import { AIService } from '../services/ai.service'
import { BusinessService } from '../services/business.service'
import { ConversationService } from '../services/conversation.service'
import { WhatsAppService } from '../services/whatsapp.service'
import type { WebhookVerificationQuery } from '../types/whatsapp.types'
import { logger } from '../utils/logger'

export class WhatsAppController {
  private whatsappService: WhatsAppService
  private aiService: AIService
  private businessService: BusinessService
  private conversationService: ConversationService

  constructor() {
    this.whatsappService = new WhatsAppService()
    this.aiService = new AIService()
    this.businessService = new BusinessService()
    this.conversationService = new ConversationService()
  }

  verifyWebhook = (
    req: Request<{}, {}, {}, WebhookVerificationQuery>,
    res: Response
  ) => {
    try {
      logger.info('🔐 Webhook verification request received')
      const challenge = this.whatsappService.verifyWebhook(req.query)
      res.status(200).send(challenge)
    } catch (error) {
      logger.error('❌ Webhook verification failed:', error)
      res.status(403).json({ error: 'Webhook verification failed' })
    }
  }

  receiveMessage = async (req: Request, res: Response) => {
    try {
      logger.info('📨 Webhook message received')

      // Process the message with AI
      await this.processIncomingMessage(req.body)

      res.status(200).json({ status: 'success' })
    } catch (error) {
      logger.error('❌ Error processing incoming message:', error)
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  private async processIncomingMessage(body: any): Promise<void> {
    console.log('Body: ', body)
    if (!body.entry) return

    for (const entry of body.entry) {
      if (!entry.changes) continue

      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value.messages) {
          const phoneNumberId = change.value.metadata.phone_number_id

          // Get business configuration for this phone number
          const businessConfig =
            await this.businessService.getBusinessByPhoneId(phoneNumberId)

          if (!businessConfig) {
            logger.warn(
              `⚠️  No business configuration found for phone number ID: ${phoneNumberId}`
            )
            continue
          }

          for (const message of change.value.messages) {
            await this.handleClientMessage(message, businessConfig)
          }
        }

        // Handle message status updates
        if (change.field === 'messages' && change.value.statuses) {
          for (const status of change.value.statuses) {
            await this.conversationService.updateMessageStatus(
              status.id,
              status.status,
              status.timestamp
            )
          }
        }
      }
    }
  }

  private async handleClientMessage(
    message: any,
    businessConfig: any
  ): Promise<void> {
    const clientPhone = message.from
    const messageId = message.id
    const timestamp = message.timestamp

    logger.info(`👤 Processing message from client ${clientPhone}`)

    try {
      // Store the incoming message
      await this.conversationService.storeMessage({
        messageId,
        businessId: businessConfig.id,
        clientPhone,
        direction: 'inbound',
        type: message.type,
        content: this.extractMessageContent(message),
        timestamp: new Date(parseInt(timestamp) * 1000),
        status: 'received',
      })

      // Get conversation context
      const conversationHistory =
        await this.conversationService.getConversationHistory(
          businessConfig.id,
          clientPhone,
          10 // Last 10 messages for context
        )

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse({
        message: this.extractMessageContent(message),
        messageType: message.type,
        businessConfig,
        conversationHistory,
        clientPhone,
      })

      if (aiResponse.shouldRespond) {
        // Send AI response
        const sentMessage = await this.whatsappService.sendMessage({
          to: clientPhone,
          message: aiResponse.message,
          type: 'text',
        })

        // Store the outbound message
        await this.conversationService.storeMessage({
          messageId: sentMessage.messages[0].id,
          businessId: businessConfig.id,
          clientPhone,
          direction: 'outbound',
          type: 'text',
          content: aiResponse.message,
          timestamp: new Date(),
          status: 'sent',
        })

        logger.info(`🤖 AI response sent to ${clientPhone}`)
      }

      // Mark original message as read
      await this.whatsappService.markMessageAsRead(messageId)
    } catch (error) {
      logger.error(`❌ Error handling client message ${messageId}:`, error)
    }
  }

  private extractMessageContent(message: any): string {
    switch (message.type) {
      case 'text':
        return message.text?.body || ''
      case 'image':
        return `[Image: ${message.image?.caption || 'No caption'}]`
      case 'document':
        return `[Document: ${message.document?.filename || 'Unknown file'}]`
      case 'audio':
        return '[Audio message]'
      case 'video':
        return `[Video: ${message.video?.caption || 'No caption'}]`
      default:
        return `[${message.type} message]`
    }
  }

  healthCheck = (req: Request, res: Response) => {
    const configStatus = this.whatsappService.getConfigStatus()
    const aiStatus = this.aiService.getStatus()

    res.json({
      status: 'ok',
      service: 'WhatsApp AI Bot',
      timestamp: new Date().toISOString(),
      whatsapp_config: configStatus,
      ai_service: aiStatus,
    })
  }
}
