/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Tickets
 *     description: Ticket management operations
 *   - name: Users
 *     description: User management operations
 *   - name: Workflows
 *     description: Workflow automation management
 *   - name: Payments
 *     description: Payment processing and subscriptions
 *   - name: SMS
 *     description: SMS messaging services
 *   - name: AI
 *     description: AI-powered features and analytics
 *   - name: Webhooks
 *     description: Webhook and integration management
 *   - name: Admin
 *     description: Administrative operations
 *   - name: Tenants
 *     description: Tenant management operations
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs, swaggerUiOptions } from '../swagger.config';

const router = Router();

// Serve API documentation
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, swaggerUiOptions));

// Serve raw OpenAPI spec
router.get('/spec', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

export default router;