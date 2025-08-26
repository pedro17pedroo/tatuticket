import nodemailer from 'nodemailer';
import { config } from '../config/app.config';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!config.email.enabled) {
      console.warn('📧 Email service disabled - SMTP configuration missing');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.port === 465,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
      });

      this.initialized = true;
      console.log('📧 Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      console.warn('📧 Email service not available - skipping email send');
      if (config.server.isDevelopment) {
        console.log('📧 [DEV] Would send email:', options);
      }
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: config.email.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Predefined templates
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Bem-vindo ao TatuTicket!',
      html: `
        <h2>Olá, ${userName}!</h2>
        <p>Bem-vindo ao TatuTicket. Sua conta foi criada com sucesso.</p>
        <p>Agora você pode começar a usar nosso sistema de tickets.</p>
        <p>Atenciosamente,<br>Equipe TatuTicket</p>
      `,
      text: `Olá, ${userName}! Bem-vindo ao TatuTicket. Sua conta foi criada com sucesso.`
    };

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendOTPEmail(to: string, otpCode: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Seu código de verificação TatuTicket',
      html: `
        <h2>Código de Verificação</h2>
        <p>Seu código de verificação é: <strong>${otpCode}</strong></p>
        <p>Este código expira em 5 minutos.</p>
        <p>Se você não solicitou este código, ignore este email.</p>
      `,
      text: `Seu código de verificação TatuTicket: ${otpCode}. Expira em 5 minutos.`
    };

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendTicketNotification(to: string, ticketNumber: string, action: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `Ticket ${ticketNumber} - ${action}`,
      html: `
        <h2>Notificação de Ticket</h2>
        <p>O ticket <strong>${ticketNumber}</strong> foi ${action}.</p>
        <p>Acesse o sistema para ver mais detalhes.</p>
        <p>Atenciosamente,<br>Equipe TatuTicket</p>
      `,
      text: `Ticket ${ticketNumber} foi ${action}. Acesse o sistema para mais detalhes.`
    };

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();