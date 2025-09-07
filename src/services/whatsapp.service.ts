import axios from 'axios'
import dotenv from 'dotenv'
import {
  SendMessageRequest,
  WebhookVerificationQuery,
} from '../types/whatsapp.types'
import { logger } from '../utils/logger'

dotenv.config()

export class WhatsAppService {
  private readonly accessToken: string
  private readonly verifyToken: string
  private readonly phoneNumberId: string
  private readonly whatsappApiUrl: string

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.whatsappApiUrl = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`

    if (!this.accessToken || !this.verifyToken || !this.phoneNumberId) {
      logger.warn(
        '⚠️  WhatsApp configuration missing. Please set environment variables.'
      )
    }
  }

  verifyWebhook(query: WebhookVerificationQuery): string {
    const {
      'hub.mode': mode,
      'hub.challenge': challenge,
      'hub.verify_token': token,
    } = query

    if (mode === 'subscribe' && token === this.verifyToken) {
      logger.info('✅ Webhook verified successfully')
      return challenge
    } else {
      throw new Error('Webhook verification failed')
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<any> {
    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error('WhatsApp configuration missing')
    }

    const { to, message, type = 'text' } = request

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type,
      text: {
        body: message,
      },
    }

    try {
      const { data } = await axios.post(this.whatsappApiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      logger.info(`✅ Message sent successfully to ${to}`)
      return data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message
      logger.error(
        '❌ Error sending message:',
        error.response?.data || error.message
      )
      throw new Error(`Failed to send message: ${errorMessage}`)
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    if (!this.accessToken || !this.phoneNumberId) {
      return
    }

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }

    try {
      await axios.post(this.whatsappApiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      logger.info(`✅ Message ${messageId} marked as read`)
    } catch (error: any) {
      logger.error(
        '❌ Error marking message as read:',
        error.response?.data || error.message
      )
    }
  }

  getConfigStatus() {
    return {
      hasAccessToken: !!this.accessToken,
      hasVerifyToken: !!this.verifyToken,
      hasPhoneNumberId: !!this.phoneNumberId,
    }
  }
}
