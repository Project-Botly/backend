export interface ConversationMessage {
  messageId: string
  businessId: string
  clientPhone: string
  direction: 'inbound' | 'outbound'
  type: string
  content: string
  timestamp: Date
  status: string
}

export interface BusinessAnalytics {
  totalMessages: number
  totalClients: number
  todayStats: {
    messages: number
    clients: number
    inbound: number
    outbound: number
  }
  weekStats: {
    messages: number
    clients: number
    inbound: number
    outbound: number
  }
  monthStats: {
    messages: number
    clients: number
    inbound: number
    outbound: number
  }
}

export interface ConversationQuery {
  page: number
  limit: number
  clientPhone?: string
}
