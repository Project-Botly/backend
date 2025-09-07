import NodeCache from 'node-cache'
import {
  BusinessAnalytics,
  ConversationMessage,
  ConversationQuery,
} from '../types/conversation.types'
import { logger } from '../utils/logger'

export class ConversationService {
  private cache: NodeCache

  constructor() {
    // Cache conversations for 7 days
    this.cache = new NodeCache({ stdTTL: 604800 })
  }

  async storeMessage(message: ConversationMessage): Promise<void> {
    const conversationKey = `conversation_${message.businessId}_${message.clientPhone}`
    const messages =
      (this.cache.get(conversationKey) as ConversationMessage[]) || []

    messages.push(message)

    // Keep only last 100 messages per conversation
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100)
    }

    this.cache.set(conversationKey, messages)

    // Also store in a global message index for analytics
    const globalKey = `messages_${message.businessId}`
    const globalMessages =
      (this.cache.get(globalKey) as ConversationMessage[]) || []
    globalMessages.push(message)

    // Keep last 1000 messages for analytics
    if (globalMessages.length > 1000) {
      globalMessages.splice(0, globalMessages.length - 1000)
    }

    this.cache.set(globalKey, globalMessages)
  }

  async getConversationHistory(
    businessId: string,
    clientPhone: string,
    limit: number = 10
  ): Promise<ConversationMessage[]> {
    const conversationKey = `conversation_${businessId}_${clientPhone}`
    const messages =
      (this.cache.get(conversationKey) as ConversationMessage[]) || []

    return messages.slice(-limit)
  }

  async updateMessageStatus(
    messageId: string,
    status: string,
    timestamp: string
  ): Promise<void> {
    // In a real implementation, you'd update the message status in the database
    // For now, we'll just log it
    logger.info(`📊 Message status updated: ${messageId} -> ${status}`)
  }

  async getBusinessAnalytics(businessId: string): Promise<BusinessAnalytics> {
    const globalKey = `messages_${businessId}`
    const messages = (this.cache.get(globalKey) as ConversationMessage[]) || []

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayMessages = messages.filter((m) => m.timestamp >= today)
    const weekMessages = messages.filter((m) => m.timestamp >= thisWeek)
    const monthMessages = messages.filter((m) => m.timestamp >= thisMonth)

    const uniqueClients = new Set(messages.map((m) => m.clientPhone))
    const todayClients = new Set(todayMessages.map((m) => m.clientPhone))
    const weekClients = new Set(weekMessages.map((m) => m.clientPhone))

    return {
      totalMessages: messages.length,
      totalClients: uniqueClients.size,
      todayStats: {
        messages: todayMessages.length,
        clients: todayClients.size,
        inbound: todayMessages.filter((m) => m.direction === 'inbound').length,
        outbound: todayMessages.filter((m) => m.direction === 'outbound')
          .length,
      },
      weekStats: {
        messages: weekMessages.length,
        clients: weekClients.size,
        inbound: weekMessages.filter((m) => m.direction === 'inbound').length,
        outbound: weekMessages.filter((m) => m.direction === 'outbound').length,
      },
      monthStats: {
        messages: monthMessages.length,
        clients: new Set(monthMessages.map((m) => m.clientPhone)).size,
        inbound: monthMessages.filter((m) => m.direction === 'inbound').length,
        outbound: monthMessages.filter((m) => m.direction === 'outbound')
          .length,
      },
    }
  }

  async getBusinessConversations(
    businessId: string,
    query: ConversationQuery
  ): Promise<{ conversations: any[]; pagination: any }> {
    const globalKey = `messages_${businessId}`
    const messages = (this.cache.get(globalKey) as ConversationMessage[]) || []

    let filteredMessages = messages

    if (query.clientPhone) {
      filteredMessages = messages.filter(
        (m) => m.clientPhone === query.clientPhone
      )
    }

    // Group by client phone
    const conversationMap = new Map<string, ConversationMessage[]>()
    filteredMessages.forEach((message) => {
      if (!conversationMap.has(message.clientPhone)) {
        conversationMap.set(message.clientPhone, [])
      }
      conversationMap.get(message.clientPhone)!.push(message)
    })

    // Convert to conversation objects
    const conversations = Array.from(conversationMap.entries()).map(
      ([clientPhone, messages]) => {
        const sortedMessages = messages.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        )
        const lastMessage = sortedMessages[0]

        return {
          clientPhone,
          lastMessage: {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            direction: lastMessage.direction,
            type: lastMessage.type,
          },
          messageCount: messages.length,
          unreadCount: messages.filter(
            (m) => m.direction === 'inbound' && m.status !== 'read'
          ).length,
        }
      }
    )

    // Sort by last message timestamp
    conversations.sort(
      (a, b) =>
        b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
    )

    // Pagination
    const total = conversations.length
    const startIndex = (query.page - 1) * query.limit
    const endIndex = startIndex + query.limit
    const paginatedConversations = conversations.slice(startIndex, endIndex)

    return {
      conversations: paginatedConversations,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    }
  }
}
