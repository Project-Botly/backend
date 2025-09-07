# AI-Powered WhatsApp Business Bot

🤖 An intelligent WhatsApp bot server that enables businesses to automatically respond to their clients using AI, built with Express.js and TypeScript.

## 🌟 Features

- **AI-Powered Responses**: Powered by OpenAI GPT for intelligent customer interactions
- **Multi-Business Support**: Manage multiple businesses with individual configurations
- **Conversation History**: Track and analyze customer conversations
- **Manual Override**: Send manual messages when needed
- **Broadcast Messaging**: Send messages to multiple clients at once
- **Analytics Dashboard**: Monitor message statistics and customer engagement
- **Smart Intent Detection**: Automatically classify customer inquiries
- **Business Hours Awareness**: Configure responses based on operating hours

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- WhatsApp Business API access
- OpenAI API key (optional but recommended)

### Installation

1. **Install pnpm** (if not already installed):

```bash
npm install -g pnpm
```

2. **Clone and install**:

```bash
git clone <repository>
cd ai-whatsapp-business-bot
pnpm install
```

3. **Configure environment**:

```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start development server**:

```bash
pnpm dev
```

## 📋 Environment Variables

```env
# WhatsApp Business API (Required)
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# OpenAI API (Optional - fallback responses if not provided)
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🏗️ API Endpoints

### WhatsApp Webhook

- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Receive messages (auto-handled)

### Business Management

- `POST /api/business/configure` - Set up a new business
- `GET /api/business/configure/:businessId` - Get business config
- `PUT /api/business/configure/:businessId` - Update business config

### Messaging

- `POST /api/business/send-message` - Send manual message
- `POST /api/business/broadcast` - Send broadcast message

### Analytics

- `GET /api/business/analytics/:businessId` - Get message analytics
- `GET /api/business/conversations/:businessId` - Get conversation history

## 💼 Business Configuration

Configure your business to customize AI responses:

```bash
curl -X POST http://localhost:3000/api/business/configure \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Restaurant",
    "industry": "Food & Beverage",
    "description": "Italian restaurant specializing in authentic pasta and pizza",
    "phoneNumberId": "your_whatsapp_phone_number_id",
    "businessHours": "Monday-Sunday: 11:00 AM - 10:00 PM",
    "aiInstructions": "Always mention our daily specials and ask if they need help with reservations.",
    "autoReply": true,
    "responseDelay": 2
  }'
```

## 📱 Usage Examples

### Send Manual Message

```bash
curl -X POST http://localhost:3000/api/business/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "your_business_id",
    "to": "1234567890",
    "message": "Hi! Thanks for contacting us. How can we help you today?",
    "type": "text"
  }'
```

### Broadcast Message

```bash
curl -X POST http://localhost:3000/api/business/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "your_business_id",
    "recipients": ["1234567890", "0987654321"],
    "message": "🎉 Special offer today! 20% off all pasta dishes. Valid until 9 PM!",
    "type": "text"
  }'
```

### Get Analytics

```bash
curl http://localhost:3000/api/business/analytics/your_business_id
```

## 🤖 AI Features

The bot intelligently handles:

- **Greeting Recognition**: Welcomes new customers
- **Business Hours Inquiries**: Provides operating hours
- **Pricing Questions**: Directs to appropriate information
- **Support Requests**: Escalates to human support when needed
- **Intent Classification**: Categorizes customer messages
- **Context Awareness**: Remembers conversation history
- **Multi-language Support**: Responds in customer's language

## 📊 Analytics & Monitoring

Track your business performance:

- **Message Volume**: Daily, weekly, monthly statistics
- **Customer Engagement**: Unique customers and response rates
- **Popular Inquiries**: Most common customer questions
- **Response Times**: AI vs manual response analysis

## 🏢 Multi-Business Architecture

Perfect for:

- **Marketing Agencies**: Manage multiple client businesses
- **Franchise Operations**: Consistent AI across locations
- **SaaS Platforms**: White-label WhatsApp bot service
- **Enterprise**: Department-specific bot configurations

## 🔧 Customization

### Custom AI Instructions

Tailor responses for your business:

```javascript
aiInstructions: `
- Always greet customers warmly
- Mention our 24/7 delivery service
- Ask for location for delivery estimates
- Escalate complaints to human support
- Use friendly, casual tone
`
```

### Response Patterns

Configure different response patterns based on:

- Time of day
- Customer history
- Message type
- Detected intent

## 🚀 Deployment

### Production Setup

1. Use environment-specific configurations
2. Set up proper database (replace NodeCache)
3. Configure logging and monitoring
4. Set up SSL/HTTPS
5. Use process managers (PM2, Docker)

### Scaling Considerations

- Implement Redis for shared cache
- Use database for persistent storage
- Add message queues for high volume
- Load balance multiple instances

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - feel free to use this in your commercial projects!

## 🆘 Support

Need help?

- Check the documentation
- Open an issue on GitHub
- Contact our support team

---

Built with ❤️ for businesses who want to provide excellent customer service through WhatsApp.
