import { Router } from 'express';
import { validateBody, catchAsync } from '../middlewares';
import { storage } from '../storage';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  headers: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  lastTriggered?: Date;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  active: boolean;
  events: string[];
  status: 'connected' | 'error' | 'disconnected';
  lastSync?: Date;
}

// Utility function to generate webhook signature
function generateWebhookSignature(payload: any, secret?: string): string {
  if (!secret) return '';
  const hash = crypto.createHmac('sha256', secret);
  hash.update(JSON.stringify(payload));
  return `sha256=${hash.digest('hex')}`;
}

// Mock data stores (fallback for now)
let webhooks: Webhook[] = [];
let integrations: Integration[] = [];

// Webhook routes
router.get('/', catchAsync(async (req, res) => {
  res.json({ webhooks });
}));

router.post('/', validateBody(z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
  headers: z.record(z.string()).optional().default({}),
  secret: z.string().optional()
})), catchAsync(async (req, res) => {
  const { name, url, events, headers, secret } = req.body;
  
  const newWebhook: Webhook = {
    id: Date.now().toString(),
    name,
    url,
    events,
    active: true,
    headers: headers || {},
    secret,
    successCount: 0,
    failureCount: 0,
    createdAt: new Date()
  };
  
  webhooksMock.push(newWebhook);
  
  res.status(201).json({
    success: true,
    webhook: newWebhook
  });
}));

router.patch('/:id/toggle', catchAsync(async (req, res) => {
  const { id } = req.params;
  const webhook = webhooksMock.find(w => w.id === id);
  
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  webhook.active = !webhook.active;
  
  res.json({
    success: true,
    webhook
  });
}));

router.post('/:id/test', catchAsync(async (req, res) => {
  const { id } = req.params;
  const webhook = webhooksMock.find(w => w.id === id);
  
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  // Simulate webhook test
  const testPayload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook from TatuTicket',
      webhook_id: webhook.id,
      webhook_name: webhook.name
    }
  };
  
  try {
    // Make real HTTP request to webhook URL
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TatuTicket-Event': 'webhook.test',
        'X-TatuTicket-Signature': generateWebhookSignature(testPayload, webhook.secret),
        ...webhook.headers
      },
      body: JSON.stringify(testPayload)
    });
    
    if (response.ok) {
      webhook.successCount++;
      webhook.lastTriggered = new Date();
      console.log(`✅ Webhook test successful: ${webhook.name}`);
    } else {
      webhook.failureCount++;
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    res.json({
      success: true,
      message: 'Test webhook sent successfully',
      payload: testPayload
    });
  } catch (error) {
    webhook.failureCount++;
    res.status(500).json({
      success: false,
      error: 'Failed to send test webhook'
    });
  }
}));

router.delete('/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  const index = webhooksMock.findIndex(w => w.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  webhooksMock.splice(index, 1);
  
  res.json({
    success: true,
    message: 'Webhook deleted successfully'
  });
}));

// Integration routes
router.get('/integrationsMock', catchAsync(async (req, res) => {
  res.json({ integrationsMock });
}));

router.post('/integrationsMock', validateBody(z.object({
  type: z.string(),
  config: z.record(z.any())
})), catchAsync(async (req, res) => {
  const { type, config } = req.body;
  
  const newIntegration: Integration = {
    id: Date.now().toString(),
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Integration`,
    type,
    config,
    active: true,
    events: ['ticket.created'],
    status: 'connected',
    lastSync: new Date()
  };
  
  integrationsMock.push(newIntegration);
  
  res.status(201).json({
    success: true,
    integration: newIntegration
  });
}));

// Utility function to trigger webhooksMock
export async function triggerWebhooks(event: string, data: any) {
  const activeWebhooks = webhooksMock.filter(w => w.active && w.events.includes(event));
  
  const promises = activeWebhooks.map(async (webhook) => {
    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        webhook_id: webhook.id
      };
      
      // Make real HTTP request with retry logic
      let retries = webhook.maxRetries || 3;
      while (retries > 0) {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-TatuTicket-Event': event,
              'X-TatuTicket-Signature': generateWebhookSignature(payload, webhook.secret),
              ...webhook.headers
            },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            webhook.successCount++;
            webhook.lastTriggered = new Date();
            console.log(`✅ Webhook ${webhook.name} triggered successfully for event ${event}`);
            break;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, webhook.retryDelay || 5000));
        }
      }
    } catch (error) {
      console.error(`Failed to trigger webhook ${webhook.name}:`, error);
      webhook.failureCount++;
    }
  });
  
  await Promise.allSettled(promises);
}

export default router;