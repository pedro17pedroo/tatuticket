import { config } from '../config/app.config';

// Mock Twilio interface for when the package isn't available
interface TwilioClient {
  messages: {
    create: (options: { body: string; from: string; to: string }) => Promise<{ sid: string }>;
  };
}

class SMSService {
  private client: TwilioClient | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!config.sms.enabled) {
      console.warn('📱 SMS service disabled - Twilio configuration missing');
      return;
    }

    try {
      // Dynamic import of Twilio - only load if configured
      const { default: twilio } = await import('twilio');
      
      this.client = twilio(
        config.sms.twilio.accountSid!,
        config.sms.twilio.authToken!
      );

      this.initialized = true;
      console.log('📱 SMS service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SMS service:', error);
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.warn('📱 SMS service not available - skipping SMS send');
      if (config.server.isDevelopment) {
        console.log('📱 [DEV] Would send SMS to', to, ':', message);
      }
      return false;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: config.sms.twilio.phoneNumber!,
        to: to,
      });

      console.log('📱 SMS sent successfully:', result.sid);
      return true;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      return false;
    }
  }

  // Predefined message templates
  async sendOTPSMS(to: string, otpCode: string): Promise<boolean> {
    const message = `Seu código de verificação TatuTicket: ${otpCode}. Expira em 5 minutos.`;
    return this.sendSMS(to, message);
  }

  async sendTicketNotificationSMS(to: string, ticketNumber: string, action: string): Promise<boolean> {
    const message = `TatuTicket: Ticket ${ticketNumber} foi ${action}. Acesse o sistema para detalhes.`;
    return this.sendSMS(to, message);
  }

  async sendWelcomeSMS(to: string, userName: string): Promise<boolean> {
    const message = `Olá ${userName}! Bem-vindo ao TatuTicket. Sua conta foi criada com sucesso.`;
    return this.sendSMS(to, message);
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const smsService = new SMSService();