import NodeCache from 'node-cache'
import { v4 as uuidv4 } from 'uuid'
import { BusinessConfig } from '../types/business.types'
import { logger } from '../utils/logger'

export class BusinessService {
  private cache: NodeCache

  constructor() {
    // Cache business configurations for 24 hours
    this.cache = new NodeCache({ stdTTL: 0 })
  }

  async createBusiness(config: BusinessConfig): Promise<BusinessConfig> {
    const businessId = uuidv4()
    const businessConfig: BusinessConfig = {
      ...config,
      id: businessId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Store in cache (in production, use a proper database)
    this.cache.set(`business_${businessId}`, businessConfig)
    this.cache.set(`phone_${config.phoneNumberId}`, businessConfig)

    logger.info(`💼 Business created: ${businessConfig.name} (${businessId})`)
    return businessConfig
  }

  async getBusinessById(businessId: string): Promise<BusinessConfig | null> {
    const business = this.cache.get(`business_${businessId}`) as BusinessConfig
    return business || null
  }

  async getBusinessByPhoneId(
    phoneNumberId: string
  ): Promise<BusinessConfig | null> {
    const business = this.cache.get(`phone_${phoneNumberId}`) as BusinessConfig
    return business || null
  }

  async updateBusiness(
    businessId: string,
    updates: Partial<BusinessConfig>
  ): Promise<BusinessConfig> {
    const existing = await this.getBusinessById(businessId)
    if (!existing) {
      throw new Error('Business not found')
    }

    const updated: BusinessConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }

    this.cache.set(`business_${businessId}`, updated)
    this.cache.set(`phone_${existing.phoneNumberId}`, updated)

    logger.info(`💼 Business updated: ${updated.name} (${businessId})`)
    return updated
  }

  async getAllBusinesses(): Promise<BusinessConfig[]> {
    const keys = this.cache.keys().filter((key) => key.startsWith('business_'))
    return keys
      .map((key) => this.cache.get(key) as BusinessConfig)
      .filter(Boolean)
  }
}
