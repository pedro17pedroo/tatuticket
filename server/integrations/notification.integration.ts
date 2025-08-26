import { emailService } from './email.integration';
import { smsService } from './sms.integration';
import { config } from '../config/app.config';

interface NotificationOptions {
  userId?: string;
  tenantId?: string;
  channels: Array<'email' | 'sms' | 'slack' | 'teams'>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

class NotificationService {
  async sendNotification(
    type: 'welcome' | 'otp' | 'ticket_created' | 'ticket_updated' | 'payment_success' | 'custom',
    recipient: { email?: string; phone?: string; name?: string },
    data: Record<string, any>,
    options: NotificationOptions
  ): Promise<{ sent: boolean; channels: Record<string, boolean> }> {
    const results: Record<string, boolean> = {};

    // Send via email
    if (options.channels.includes('email') && recipient.email) {
      results.email = await this.sendEmailNotification(type, recipient.email, recipient.name, data);
    }

    // Send via SMS
    if (options.channels.includes('sms') && recipient.phone) {
      results.sms = await this.sendSMSNotification(type, recipient.phone, recipient.name, data);
    }

    // Send via Slack
    if (options.channels.includes('slack')) {
      results.slack = await this.sendSlackNotification(type, data, options);
    }

    // Send via Teams
    if (options.channels.includes('teams')) {
      results.teams = await this.sendTeamsNotification(type, data, options);
    }

    const sent = Object.values(results).some(result => result === true);

    console.log(`📢 Notification sent: ${type}`, { sent, channels: results });

    return { sent, channels: results };
  }

  private async sendEmailNotification(
    type: string, 
    email: string, 
    name?: string, 
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      switch (type) {
        case 'welcome':
          return await emailService.sendWelcomeEmail(email, name || 'Usuário');
          
        case 'otp':
          return await emailService.sendOTPEmail(email, data?.otpCode || '000000');
          
        case 'ticket_created':
        case 'ticket_updated':
          return await emailService.sendTicketNotification(
            email, 
            data?.ticketNumber || 'N/A', 
            type === 'ticket_created' ? 'criado' : 'atualizado'
          );

        case 'custom':
          return await emailService.sendEmail({
            to: email,
            subject: data?.subject || 'Notificação TatuTicket',
            html: data?.html,
            text: data?.text,
          });

        default:
          return false;
      }
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
      return false;
    }
  }

  private async sendSMSNotification(
    type: string, 
    phone: string, 
    name?: string, 
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      switch (type) {
        case 'welcome':
          return await smsService.sendWelcomeSMS(phone, name || 'Usuário');
          
        case 'otp':
          return await smsService.sendOTPSMS(phone, data?.otpCode || '000000');
          
        case 'ticket_created':
        case 'ticket_updated':
          return await smsService.sendTicketNotificationSMS(
            phone, 
            data?.ticketNumber || 'N/A', 
            type === 'ticket_created' ? 'criado' : 'atualizado'
          );

        case 'custom':
          return await smsService.sendSMS(phone, data?.message || 'Notificação TatuTicket');

        default:
          return false;
      }
    } catch (error) {
      console.error('❌ Failed to send SMS notification:', error);
      return false;
    }
  }

  private async sendSlackNotification(
    type: string, 
    data: Record<string, any>,
    options: NotificationOptions
  ): Promise<boolean> {
    if (!config.integrations.slack.enabled) {
      return false;
    }

    try {
      const message = this.formatSlackMessage(type, data, options);
      
      const response = await fetch(config.integrations.slack.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
      return false;
    }
  }

  private async sendTeamsNotification(
    type: string, 
    data: Record<string, any>,
    options: NotificationOptions
  ): Promise<boolean> {
    if (!config.integrations.teams.enabled) {
      return false;
    }

    try {
      const message = this.formatTeamsMessage(type, data, options);
      
      const response = await fetch(config.integrations.teams.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to send Teams notification:', error);
      return false;
    }
  }

  private formatSlackMessage(type: string, data: Record<string, any>, options: NotificationOptions): SlackMessage {
    const priority = options.priority;
    const emoji = priority === 'urgent' ? '🚨' : priority === 'high' ? '⚠️' : '📢';
    
    let text = `${emoji} TatuTicket - `;
    
    switch (type) {
      case 'ticket_created':
        text += `Novo ticket criado: ${data.ticketNumber}\nAssunto: ${data.subject}`;
        break;
      case 'ticket_updated':
        text += `Ticket atualizado: ${data.ticketNumber}\nStatus: ${data.status}`;
        break;
      case 'payment_success':
        text += `Pagamento confirmado para ${data.customerName}\nPlano: ${data.plan}`;
        break;
      default:
        text += data.message || 'Notificação do sistema';
    }

    return {
      text,
      username: 'TatuTicket Bot',
      icon_emoji: ':ticket:',
    };
  }

  private formatTeamsMessage(type: string, data: Record<string, any>, options: NotificationOptions) {
    const priority = options.priority;
    const color = priority === 'urgent' ? 'attention' : priority === 'high' ? 'warning' : 'good';
    
    let title = '';
    let text = '';
    
    switch (type) {
      case 'ticket_created':
        title = '🎫 Novo Ticket Criado';
        text = `**Ticket:** ${data.ticketNumber}\n**Assunto:** ${data.subject}`;
        break;
      case 'ticket_updated':
        title = '📝 Ticket Atualizado';
        text = `**Ticket:** ${data.ticketNumber}\n**Status:** ${data.status}`;
        break;
      case 'payment_success':
        title = '💳 Pagamento Confirmado';
        text = `**Cliente:** ${data.customerName}\n**Plano:** ${data.plan}`;
        break;
      default:
        title = '📢 TatuTicket Notification';
        text = data.message || 'Notificação do sistema';
    }

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: title,
      themeColor: color === 'attention' ? 'FF0000' : color === 'warning' ? 'FFA500' : '00FF00',
      sections: [{
        activityTitle: title,
        activityText: text,
        markdown: true,
      }],
    };
  }

  // Predefined notification methods for common scenarios
  async notifyTicketCreated(
    ticketData: { number: string; subject: string; priority: string },
    recipient: { email?: string; phone?: string; name?: string },
    options?: Partial<NotificationOptions>
  ) {
    const channels: Array<'email' | 'sms' | 'slack' | 'teams'> = ['email'];
    
    if (ticketData.priority === 'critical' || ticketData.priority === 'high') {
      channels.push('sms', 'slack');
    }

    return this.sendNotification('ticket_created', recipient, ticketData, {
      channels,
      priority: ticketData.priority as any,
      ...options,
    });
  }

  async notifyWelcome(
    recipient: { email: string; phone?: string; name: string },
    options?: Partial<NotificationOptions>
  ) {
    return this.sendNotification('welcome', recipient, {}, {
      channels: ['email'],
      priority: 'low',
      ...options,
    });
  }

  async notifyOTP(
    recipient: { email?: string; phone?: string },
    otpCode: string,
    options?: Partial<NotificationOptions>
  ) {
    const channels: Array<'email' | 'sms'> = [];
    if (recipient.email) channels.push('email');
    if (recipient.phone) channels.push('sms');

    return this.sendNotification('otp', recipient, { otpCode }, {
      channels,
      priority: 'medium',
      ...options,
    });
  }
}

export const notificationService = new NotificationService();