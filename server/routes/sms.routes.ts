import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { smsService } from '../integrations/sms.integration';
import { catchAsync } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validation.middleware';

const router = Router();

// Schema para envio de SMS
const sendSMSSchema = z.object({
  to: z.string().min(10, 'Número de telefone inválido'),
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(1600, 'Mensagem muito longa'),
  templateType: z.enum(['ticket_created', 'sla_alert', 'status_update', 'custom']).optional()
});

// Schema para notificação de SLA
const slaAlertSchema = z.object({
  ticketId: z.string(),
  customerPhone: z.string(),
  ticketNumber: z.string(),
  timeRemaining: z.number(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'])
});

// POST /api/sms/send - Enviar SMS
router.post('/send', validateBody(sendSMSSchema), catchAsync(async (req: Request, res: Response) => {
  const { to, message, templateType } = req.body;
  
  try {
    if (!smsService.isEnabled()) {
      // Mock SMS sending for demo
      const mockResult = {
        sid: `SM${Date.now()}`,
        status: 'queued',
        to: to,
        from: '+15551234567'
      };
      
      console.log(`📱 Mock SMS sent to ${to}: ${message}`);
      
      return res.json({
        success: true,
        messageId: mockResult.sid,
        status: mockResult.status,
        to: mockResult.to,
        from: mockResult.from
      });
    }

    const result = await smsService.sendSMS(to, message);
    
    res.json({
      success: true,
      messageId: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    });
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send SMS' 
    });
  }
}));

// POST /api/sms/ticket-notification - Notificação de ticket por SMS
router.post('/ticket-notification', validateBody(z.object({
  customerPhone: z.string(),
  ticketNumber: z.string(),
  status: z.string(),
  message: z.string().optional()
})), catchAsync(async (req: Request, res: Response) => {
  const { customerPhone, ticketNumber, status, message } = req.body;
  
  let smsMessage = message;
  
  // Usar template baseado no status se mensagem não fornecida
  if (!smsMessage) {
    const templates = {
      'created': `TatuTicket: Seu ticket ${ticketNumber} foi criado e está em análise. Acompanhe o status em nosso portal.`,
      'in_progress': `TatuTicket: Ticket ${ticketNumber} está sendo processado por nossa equipe. Você receberá atualizações em breve.`,
      'resolved': `TatuTicket: Seu ticket ${ticketNumber} foi resolvido! Verifique a solução em nosso portal.`,
      'closed': `TatuTicket: Ticket ${ticketNumber} foi finalizado. Obrigado por usar nossos serviços!`
    };
    
    smsMessage = templates[status as keyof typeof templates] || 
      `TatuTicket: Status do ticket ${ticketNumber} atualizado para: ${status}`;
  }
  
  try {
    if (!smsService.isEnabled()) {
      // Mock ticket SMS for demo
      console.log(`📱 Mock ticket SMS to ${customerPhone}: ${smsMessage}`);
      
      return res.json({
        success: true,
        messageId: `SM${Date.now()}`,
        ticketNumber,
        sentTo: customerPhone
      });
    }

    const result = await smsService.sendSMS(customerPhone, smsMessage);
    
    res.json({
      success: true,
      messageId: result?.sid || `SM${Date.now()}`,
      ticketNumber,
      sentTo: customerPhone
    });
    
  } catch (error) {
    console.error('Error sending ticket SMS:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send ticket notification' 
    });
  }
}));

// POST /api/sms/sla-alert - Alerta de SLA por SMS
router.post('/sla-alert', validateBody(slaAlertSchema), catchAsync(async (req: Request, res: Response) => {
  const { ticketId, customerPhone, ticketNumber, timeRemaining, priority } = req.body;
  
  const urgencyMap = {
    low: '⚠️',
    medium: '⚠️',
    high: '🚨',
    urgent: '🔴'
  };
  
  const hoursRemaining = Math.floor(timeRemaining / 60);
  const minutesRemaining = timeRemaining % 60;
  
  const smsMessage = `${urgencyMap[priority]} TatuTicket ALERTA SLA: Ticket ${ticketNumber} próximo do vencimento. Tempo restante: ${hoursRemaining}h ${minutesRemaining}min. Entre em contato conosco.`;
  
  try {
    if (!smsService.isEnabled()) {
      // Mock SLA alert SMS for demo
      console.log(`📱 Mock SLA alert SMS to ${customerPhone}: ${smsMessage}`);
      
      return res.json({
        success: true,
        messageId: `SM${Date.now()}`,
        ticketNumber,
        timeRemaining,
        priority,
        sentTo: customerPhone
      });
    }

    const result = await smsService.sendSMS(customerPhone, smsMessage);
    
    res.json({
      success: true,
      messageId: result?.sid || `SM${Date.now()}`,
      ticketNumber,
      timeRemaining,
      priority,
      sentTo: customerPhone
    });
    
  } catch (error) {
    console.error('Error sending SLA alert SMS:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send SLA alert' 
    });
  }
}));

// POST /api/sms/bulk-send - Envio em massa
router.post('/bulk-send', validateBody(z.object({
  recipients: z.array(z.object({
    phone: z.string(),
    name: z.string().optional(),
    customData: z.record(z.any()).optional()
  })),
  message: z.string().max(1600),
  template: z.string().optional()
})), catchAsync(async (req: Request, res: Response) => {
  const { recipients, message, template } = req.body;
  
  if (recipients.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Máximo de 100 destinatários por envio'
    });
  }
  
  const results = [];
  
  for (const recipient of recipients) {
    try {
      let personalizedMessage = message;
      
      // Personalizar mensagem se dados fornecidos
      if (recipient.customData) {
        Object.keys(recipient.customData).forEach(key => {
          personalizedMessage = personalizedMessage.replace(
            new RegExp(`{{${key}}}`, 'g'), 
            recipient.customData![key]
          );
        });
      }
      
      if (recipient.name) {
        personalizedMessage = personalizedMessage.replace(/{{name}}/g, recipient.name);
      }
      
      if (!smsService.isEnabled()) {
        // Mock bulk SMS for demo
        results.push({
          phone: recipient.phone,
          success: true,
          messageId: `SM${Date.now()}_${Math.random()}`,
          status: 'queued'
        });
      } else {
        const result = await smsService.sendSMS(recipient.phone, personalizedMessage);
        
        results.push({
          phone: recipient.phone,
          success: true,
          messageId: result?.sid || `SM${Date.now()}`,
          status: result?.status || 'queued'
        });
      }
      
    } catch (error) {
      results.push({
        phone: recipient.phone,
        success: false,
        error: (error as Error).message
      });
    }
    
    // Delay entre envios para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  res.json({
    success: true,
    totalSent: successCount,
    totalFailed: failureCount,
    results
  });
}));

// GET /api/sms/status/:messageId - Status do SMS
router.get('/status/:messageId', catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  
  try {
    if (!smsService.isEnabled()) {
      // Mock SMS status for demo
      return res.json({
        sid: messageId,
        status: 'delivered',
        to: '+5511999999999',
        from: '+15551234567',
        dateCreated: new Date().toISOString()
      });
    }

    const status = await smsService.getMessageStatus(messageId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching SMS status:', error);
    res.status(404).json({ error: 'Message not found' });
  }
}));

export default router;