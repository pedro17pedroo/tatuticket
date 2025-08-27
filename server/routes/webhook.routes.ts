import { Router } from 'express';
import { validateBody } from '../middlewares';
import { catchAsync } from '../middlewares';
import { z } from 'zod';

const router = Router();

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  headers: Record<string, string>;
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

// Mock data stores
let webhooks: Webhook[] = [
  {
    id: '1',
    name: 'Notificações Slack',
    url: 'https://hooks.slack.com/services/xxx',
    events: ['ticket.created', 'sla.breach'],
    active: true,
    headers: {},
    successCount: 127,
    failureCount: 3,
    createdAt: new Date('2025-01-15'),
    lastTriggered: new Date('2025-01-26')
  }
];

let integrations: Integration[] = [
  {
    id: '1',
    name: 'Slack Workspace',
    type: 'slack',
    config: { webhook_url: 'https://hooks.slack.com/xxx' },
    active: true,
    events: ['ticket.created', 'sla.breach'],
    status: 'connected',
    lastSync: new Date('2025-01-26')
  }
];

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
  
  webhooks.push(newWebhook);
  
  res.status(201).json({
    success: true,
    webhook: newWebhook
  });
}));

router.patch('/:id/toggle', catchAsync(async (req, res) => {
  const { id } = req.params;
  const webhook = webhooks.find(w => w.id === id);
  
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
  const webhook = webhooks.find(w => w.id === id);
  
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
    // In real implementation, make HTTP request to webhook.url
    console.log(`📡 Testing webhook ${webhook.name} at ${webhook.url}`);
    console.log('Test payload:', testPayload);
    
    webhook.successCount++;
    webhook.lastTriggered = new Date();
    
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
  const index = webhooks.findIndex(w => w.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  webhooks.splice(index, 1);
  
  res.json({
    success: true,
    message: 'Webhook deleted successfully'
  });
}));

// Integration routes
router.get('/integrations', catchAsync(async (req, res) => {
  res.json({ integrations });
}));

router.post('/integrations', validateBody(z.object({
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
  
  integrations.push(newIntegration);
  
  res.status(201).json({
    success: true,
    integration: newIntegration
  });
}));

// Utility function to trigger webhooks
export async function triggerWebhooks(event: string, data: any) {
  const activeWebhooks = webhooks.filter(w => w.active && w.events.includes(event));
  
  for (const webhook of activeWebhooks) {
    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        webhook_id: webhook.id
      };
      
      // In real implementation, make HTTP request
      console.log(`📡 Triggering webhook ${webhook.name} for event ${event}`);
      console.log('Payload:', payload);
      
      webhook.successCount++;
      webhook.lastTriggered = new Date();
    } catch (error) {
      console.error(`Failed to trigger webhook ${webhook.name}:`, error);
      webhook.failureCount++;
    }
  }
}

export default router;