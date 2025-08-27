import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TatuTicket API',
      version: '1.0.0',
      description: 'API completa do sistema de gerenciamento de tickets TatuTicket',
      contact: {
        name: 'TatuTicket Support',
        url: 'https://tatuticket.com/support',
        email: 'support@tatuticket.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Auth Schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique user identifier' },
            username: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'User email' },
            role: { 
              type: 'string', 
              enum: ['user', 'agent', 'manager', 'admin', 'super_admin'],
              description: 'User role'
            },
            tenantId: { type: 'string', description: 'Tenant ID' },
            isActive: { type: 'boolean', description: 'User active status' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'tenantId'],
          properties: {
            username: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            tenantId: { type: 'string' },
            role: { type: 'string', enum: ['user', 'agent', 'manager', 'admin'] }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 }
          }
        },
        OTPRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', description: 'Phone number for SMS OTP' },
            type: { type: 'string', default: 'email_verification' },
            method: { type: 'string', enum: ['email', 'sms'], default: 'email' }
          }
        },
        VerifyOTPRequest: {
          type: 'object',
          required: ['email', 'code'],
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            code: { type: 'string', pattern: '^[0-9]{6}$' },
            type: { type: 'string', default: 'email_verification' }
          }
        },

        // Ticket Schemas
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['open', 'in_progress', 'resolved', 'closed', 'pending'] 
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'urgent'] 
            },
            tenantId: { type: 'string' },
            customerId: { type: 'string' },
            assigneeId: { type: 'string' },
            departmentId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateTicketRequest: {
          type: 'object',
          required: ['title', 'description', 'tenantId'],
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: 'string', minLength: 1 },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
            tenantId: { type: 'string' },
            customerId: { type: 'string' },
            departmentId: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },

        // Workflow Schemas
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            trigger: {
              type: 'object',
              properties: {
                type: { 
                  type: 'string', 
                  enum: ['ticket_created', 'ticket_updated', 'ticket_assigned', 'sla_breach', 'customer_response'] 
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      operator: { type: 'string', enum: ['equals', 'contains', 'greater_than', 'less_than', 'not_equals'] },
                      value: { type: 'string' }
                    }
                  }
                }
              }
            },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { 
                    type: 'string', 
                    enum: ['assign_agent', 'send_notification', 'update_priority', 'add_tag', 'escalate', 'send_email', 'webhook_call'] 
                  },
                  params: { type: 'object' },
                  delay: { type: 'number', description: 'Delay in minutes' }
                }
              }
            },
            isActive: { type: 'boolean' },
            priority: { type: 'number', minimum: 1, maximum: 10 }
          }
        },

        // Payment Schemas
        CreateSubscriptionRequest: {
          type: 'object',
          required: ['email', 'planId', 'companyName', 'paymentMethodId', 'billingInfo'],
          properties: {
            email: { type: 'string', format: 'email' },
            planId: { type: 'string', enum: ['starter', 'professional', 'enterprise'] },
            companyName: { type: 'string' },
            paymentMethodId: { type: 'string' },
            billingInfo: {
              type: 'object',
              properties: {
                companyName: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                taxId: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    number: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zipCode: { type: 'string' }
                  }
                }
              }
            }
          }
        },

        // SMS Schemas
        SendSMSRequest: {
          type: 'object',
          required: ['to', 'message'],
          properties: {
            to: { type: 'string', minLength: 10, description: 'Phone number' },
            message: { type: 'string', minLength: 1, maxLength: 1600 },
            templateType: { 
              type: 'string', 
              enum: ['ticket_created', 'sla_alert', 'status_update', 'custom'] 
            }
          }
        },

        // Webhook Schemas
        Webhook: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string' } },
            active: { type: 'boolean' },
            headers: { type: 'object' },
            secret: { type: 'string' },
            successCount: { type: 'number' },
            failureCount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },

        // AI Schemas
        AnalyzeTicketRequest: {
          type: 'object',
          required: ['subject', 'description'],
          properties: {
            subject: { type: 'string', minLength: 1 },
            description: { type: 'string', minLength: 1 }
          }
        },
        AIInsight: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['prediction', 'anomaly', 'recommendation'] },
            title: { type: 'string' },
            description: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            category: { type: 'string' },
            actionable: { type: 'boolean' },
            relatedTickets: { type: 'array', items: { type: 'string' } }
          }
        },

        // Error Schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' }
          }
        },

        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server/routes/*.ts'], // Path to the API files
};

export const specs = swaggerJSDoc(options);
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .scheme-container { background: #fafafa; padding: 20px; }
  `,
  customSiteTitle: 'TatuTicket API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'list',
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
  }
};

export default { specs, swaggerUi, swaggerUiOptions };