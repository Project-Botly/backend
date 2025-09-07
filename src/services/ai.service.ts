import dotenv from 'dotenv'
import OpenAI from 'openai'
import { BusinessConfig } from '../types/business.types'
import { ConversationMessage } from '../types/conversation.types'
import { logger } from '../utils/logger'

dotenv.config()

interface AIRequest {
  message: string
  messageType: string
  businessConfig: BusinessConfig
  conversationHistory: ConversationMessage[]
  clientPhone: string
}

interface AIResponse {
  message: string
  shouldRespond: boolean
  confidence: number
  intent?: string
}

export class AIService {
  private openai: OpenAI | null = null

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      this.openai = new OpenAI({ apiKey })
      logger.info('🤖 OpenAI service initialized')
    } else {
      logger.warn(
        '⚠️  OpenAI API key not found. AI responses will be disabled.'
      )
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.openai) {
      // Fallback response when AI is not available
      return {
        message: `Thank you for your message! We'll get back to you soon.`,
        shouldRespond: true,
        confidence: 0.5,
      }
    }

    try {
      const systemPrompt = this.buildSystemPrompt(request.businessConfig)
      const userPrompt = this.buildUserPrompt(request)

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      })

      const aiMessage = completion.choices[0]?.message?.content?.trim()

      if (!aiMessage) {
        throw new Error('No response generated')
      }

      // Parse response to determine if we should respond
      const shouldRespond = this.shouldRespondToMessage(
        request.message,
        request.messageType
      )

      return {
        message: aiMessage,
        shouldRespond,
        confidence: 0.8,
        intent: this.detectIntent(request.message),
      }
    } catch (error) {
      logger.error('❌ Error generating AI response:', error)

      // Fallback response
      return {
        message: `Hello! Thank you for contacting ${request.businessConfig.name}. We'll assist you shortly.`,
        shouldRespond: true,
        confidence: 0.3,
      }
    }
  }

  private buildSystemPrompt(businessConfig: BusinessConfig): string {
    return `You are an AI assistant for ${businessConfig.name}, a ${
      businessConfig.industry
    } business.

    Business Information:
    - Name: ${businessConfig.name}
    - Industry: ${businessConfig.industry}
    - Description: ${businessConfig.description || 'No description provided'}
    - Business Hours: ${businessConfig.businessHours || 'Not specified'}

    Instructions:
    - Respond as a helpful customer service representative
    - Keep responses concise and professional
    - Use the business information to provide relevant assistance
    - If you can't help with something, politely direct them to human support
    - Always maintain a friendly and professional tone
    - Respond in the same language as the customer
    - Don't make promises about pricing or availability without explicit information

    ${businessConfig.aiInstructions || ''}`
  }

  private buildUserPrompt(request: AIRequest): string {
    let prompt = `Customer message: "${request.message}"\n`
    prompt += `Message type: ${request.messageType}\n`
    prompt += `Customer phone: ${request.clientPhone}\n\n`

    if (request.conversationHistory.length > 0) {
      prompt += 'Recent conversation history:\n'
      request.conversationHistory.slice(-5).forEach((msg, index) => {
        const direction = msg.direction === 'inbound' ? 'Customer' : 'Assistant'
        prompt += `${direction}: ${msg.content}\n`
      })
      prompt += '\n'
    }

    prompt += 'Provide a helpful response to the customer:'

    return prompt
  }

  private shouldRespondToMessage(
    message: string,
    messageType: string
  ): boolean {
    // Don't respond to non-text messages by default
    if (messageType !== 'text') {
      return false
    }

    // Don't respond to very short messages that might be accidental
    if (message.length < 3) {
      return false
    }

    // Add more sophisticated logic here based on business rules
    return true
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (
      lowerMessage.includes('price') ||
      lowerMessage.includes('cost') ||
      lowerMessage.includes('$')
    ) {
      return 'pricing_inquiry'
    }
    if (
      lowerMessage.includes('hours') ||
      lowerMessage.includes('open') ||
      lowerMessage.includes('closed')
    ) {
      return 'hours_inquiry'
    }
    if (
      lowerMessage.includes('location') ||
      lowerMessage.includes('address') ||
      lowerMessage.includes('where')
    ) {
      return 'location_inquiry'
    }
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey')
    ) {
      return 'greeting'
    }
    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('support') ||
      lowerMessage.includes('problem')
    ) {
      return 'support_request'
    }

    return 'general_inquiry'
  }

  getStatus() {
    return {
      available: !!this.openai,
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
    }
  }
}
