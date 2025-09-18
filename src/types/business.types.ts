export interface BusinessConfig {
  id?: string
  name: string
  industry: string
  email: string
  phoneNumber: string
  phoneNumberId: string
  wabaId: string
  description?: string
  businessHours?: string
  aiInstructions?: string
  autoReply?: boolean
  responseDelay?: number // seconds
  createdAt?: Date
  updatedAt?: Date
}

export interface SendMessageRequest {
  businessId: string
  to: string
  message: string
  type?: string
}

export interface BroadcastRequest {
  businessId: string
  recipients: string[]
  message: string
  type?: string
}
