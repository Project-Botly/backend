export interface SendMessageRequest {
  to: string
  message: string
  type?: string
}

export interface WebhookVerificationQuery {
  'hub.mode': string
  'hub.challenge': string
  'hub.verify_token': string
}

export interface WhatsAppMessage {
  id: string
  from: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  text?: {
    body: string
  }
  image?: {
    id: string
    mime_type: string
    sha256: string
    caption?: string
  }
  document?: {
    id: string
    filename: string
    mime_type: string
    sha256: string
  }
  audio?: {
    id: string
    mime_type: string
    sha256: string
  }
  video?: {
    id: string
    mime_type: string
    sha256: string
    caption?: string
  }
}

export interface WhatsAppWebhookBody {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      field: string
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: WhatsAppMessage[]
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
    }>
  }>
}
