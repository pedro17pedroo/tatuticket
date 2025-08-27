import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { workflows, workflowExecutions, tickets, users } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { catchAsync } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validation.middleware';

const router = Router();

// Schema for workflow creation
const createWorkflowSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['ticket_created', 'ticket_updated', 'ticket_assigned', 'sla_breach']),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
      value: z.any(),
    })).optional(),
  }),
  actions: z.array(z.object({
    type: z.enum(['assign_agent', 'send_notification', 'update_priority', 'add_tag', 'escalate']),
    params: z.record(z.any()),
  })),
  isActive: z.boolean().default(true),
  priority: z.number().default(1),
});

const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  input: z.record(z.any()).optional(),
});

// GET /api/workflows/:tenantId - Get all workflows for tenant
router.get('/:tenantId', catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  
  const tenantWorkflows = await db.query.workflows.findMany({
    where: eq(workflows.tenantId, tenantId),
    with: {
      creator: {
        columns: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: [workflows.priority, desc(workflows.createdAt)],
  });
  
  res.json(tenantWorkflows);
}));

// POST /api/workflows - Create new workflow
router.post('/', validateBody(createWorkflowSchema), catchAsync(async (req: Request, res: Response) => {
  const { tenantId, name, description, trigger, actions, isActive, priority } = req.body;
  const createdBy = (req as any).user?.id || 'system'; // From auth middleware
  
  const workflow = await db.insert(workflows).values({
    tenantId,
    name,
    description,
    trigger,
    actions,
    isActive,
    priority,
    createdBy,
  }).returning();
  
  res.json(workflow[0]);
}));

// PUT /api/workflows/:id - Update workflow
router.put('/:id', validateBody(createWorkflowSchema.partial()), catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const workflow = await db.update(workflows)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, id))
    .returning();
  
  if (workflow.length === 0) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.json(workflow[0]);
}));

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await db.delete(workflows).where(eq(workflows.id, id));
  
  res.json({ success: true });
}));

// POST /api/workflows/execute - Execute workflow
router.post('/execute', validateBody(executeWorkflowSchema), catchAsync(async (req: Request, res: Response) => {
  const { workflowId, resourceType, resourceId, input } = req.body;
  
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
  });
  
  if (!workflow || !workflow.isActive) {
    return res.status(404).json({ error: 'Workflow not found or inactive' });
  }
  
  try {
    // Execute workflow actions
    const output = await executeWorkflowActions(workflow, resourceType, resourceId, input);
    
    // Log execution
    await db.insert(workflowExecutions).values({
      workflowId,
      tenantId: workflow.tenantId,
      resourceType,
      resourceId,
      status: 'success',
      input,
      output,
    });
    
    res.json({
      success: true,
      workflowId,
      output,
    });
  } catch (error) {
    // Log failed execution
    await db.insert(workflowExecutions).values({
      workflowId,
      tenantId: workflow.tenantId,
      resourceType,
      resourceId,
      status: 'failed',
      input,
      error: (error as Error).message,
    });
    
    console.error('Workflow execution failed:', error);
    res.status(500).json({ error: 'Workflow execution failed' });
  }
}));

// GET /api/workflows/:workflowId/executions - Get workflow execution history
router.get('/:workflowId/executions', catchAsync(async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  const executions = await db.query.workflowExecutions.findMany({
    where: eq(workflowExecutions.workflowId, workflowId),
    orderBy: desc(workflowExecutions.executedAt),
    limit: Number(limit),
    offset: Number(offset),
  });
  
  res.json(executions);
}));

// Helper function to execute workflow actions
async function executeWorkflowActions(workflow: any, resourceType: string, resourceId: string, input: any) {
  const output = [];
  
  for (const action of workflow.actions) {
    try {
      let actionResult;
      
      switch (action.type) {
        case 'assign_agent':
          if (resourceType === 'ticket') {
            await db.update(tickets)
              .set({
                assigneeId: action.params.agentId,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, resourceId));
            actionResult = { type: 'assign_agent', agentId: action.params.agentId };
          }
          break;
          
        case 'update_priority':
          if (resourceType === 'ticket') {
            await db.update(tickets)
              .set({
                priority: action.params.priority,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, resourceId));
            actionResult = { type: 'update_priority', priority: action.params.priority };
          }
          break;
          
        case 'send_notification':
          // Here would be notification sending logic
          console.log('📧 Sending notification:', action.params);
          actionResult = { type: 'send_notification', sent: true };
          break;
          
        case 'escalate':
          if (resourceType === 'ticket') {
            await db.update(tickets)
              .set({
                priority: 'critical',
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, resourceId));
            actionResult = { type: 'escalate', newPriority: 'critical' };
          }
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
          actionResult = { type: action.type, status: 'skipped' };
      }
      
      output.push(actionResult);
    } catch (error) {
      console.error(`Action ${action.type} failed:`, error);
      output.push({ type: action.type, status: 'failed', error: (error as Error).message });
    }
  }
  
  return output;
}

// Template workflows for quick setup
const WORKFLOW_TEMPLATES = [
  {
    name: 'Auto-assign New Tickets',
    description: 'Automatically assign new tickets to available agents',
    trigger: {
      type: 'ticket_created',
      conditions: []
    },
    actions: [
      {
        type: 'assign_agent',
        params: { strategy: 'round_robin' }
      }
    ]
  },
  {
    name: 'Escalate High Priority',
    description: 'Escalate high priority tickets after 2 hours',
    trigger: {
      type: 'ticket_created',
      conditions: [
        { field: 'priority', operator: 'equals', value: 'high' }
      ]
    },
    actions: [
      {
        type: 'send_notification',
        params: { recipient: 'manager', message: 'High priority ticket needs attention' }
      }
    ]
  },
  {
    name: 'SLA Breach Alert',
    description: 'Send alert when SLA is about to be breached',
    trigger: {
      type: 'sla_breach',
      conditions: []
    },
    actions: [
      {
        type: 'escalate',
        params: {}
      },
      {
        type: 'send_notification',
        params: { recipient: 'manager', message: 'SLA breach detected' }
      }
    ]
  }
];

// GET /api/workflows/templates - Get workflow templates
router.get('/templates/list', catchAsync(async (req: Request, res: Response) => {
  res.json(WORKFLOW_TEMPLATES);
}));

export default router;