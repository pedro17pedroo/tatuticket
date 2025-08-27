import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Mock workflow data
const MOCK_WORKFLOWS = [
  {
    id: '1',
    name: 'Auto-assign New Tickets',
    description: 'Automatically assign new tickets to available agents using round-robin',
    trigger: {
      type: 'ticket_created',
      conditions: []
    },
    actions: [
      {
        id: '1',
        type: 'assign_agent',
        params: { strategy: 'round_robin', department: 'support' }
      }
    ],
    isActive: true,
    priority: 1,
    executionCount: 234,
    successRate: 98.5,
    createdAt: new Date(),
    lastExecuted: new Date()
  },
  {
    id: '2',
    name: 'Escalate High Priority Tickets',
    description: 'Escalate high priority tickets after 2 hours without response',
    trigger: {
      type: 'ticket_created',
      conditions: [
        { field: 'priority', operator: 'equals', value: 'high' }
      ]
    },
    actions: [
      {
        id: '1',
        type: 'send_notification',
        params: { recipient: 'manager', message: 'High priority ticket needs attention' },
        delay: 120
      },
      {
        id: '2',
        type: 'escalate',
        params: {},
        delay: 120
      }
    ],
    isActive: true,
    priority: 2,
    executionCount: 89,
    successRate: 96.2,
    createdAt: new Date(),
    lastExecuted: new Date()
  }
];

// Get all workflows
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      workflows: MOCK_WORKFLOWS
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows'
    });
  }
});

// Get workflow by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = MOCK_WORKFLOWS.find(w => w.id === id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow'
    });
  }
});

// Create new workflow
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, trigger, actions, isActive, priority } = req.body;

    if (!name || !trigger || !actions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, trigger, actions'
      });
    }

    const newWorkflow = {
      id: (MOCK_WORKFLOWS.length + 1).toString(),
      name,
      description,
      trigger,
      actions,
      isActive: isActive || true,
      priority: priority || 1,
      executionCount: 0,
      successRate: 100,
      createdAt: new Date(),
      lastExecuted: null
    };

    MOCK_WORKFLOWS.push(newWorkflow);

    res.status(201).json({
      success: true,
      workflow: newWorkflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow'
    });
  }
});

// Update workflow
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, trigger, actions, isActive, priority } = req.body;

    const workflowIndex = MOCK_WORKFLOWS.findIndex(w => w.id === id);
    
    if (workflowIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Update workflow
    MOCK_WORKFLOWS[workflowIndex] = {
      ...MOCK_WORKFLOWS[workflowIndex],
      name: name || MOCK_WORKFLOWS[workflowIndex].name,
      description: description || MOCK_WORKFLOWS[workflowIndex].description,
      trigger: trigger || MOCK_WORKFLOWS[workflowIndex].trigger,
      actions: actions || MOCK_WORKFLOWS[workflowIndex].actions,
      isActive: isActive !== undefined ? isActive : MOCK_WORKFLOWS[workflowIndex].isActive,
      priority: priority || MOCK_WORKFLOWS[workflowIndex].priority
    };

    res.json({
      success: true,
      workflow: MOCK_WORKFLOWS[workflowIndex],
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow'
    });
  }
});

// Delete workflow
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workflowIndex = MOCK_WORKFLOWS.findIndex(w => w.id === id);
    
    if (workflowIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    MOCK_WORKFLOWS.splice(workflowIndex, 1);

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow'
    });
  }
});

// Toggle workflow active status
router.patch('/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const workflowIndex = MOCK_WORKFLOWS.findIndex(w => w.id === id);
    
    if (workflowIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    MOCK_WORKFLOWS[workflowIndex].isActive = isActive;

    res.json({
      success: true,
      workflow: MOCK_WORKFLOWS[workflowIndex],
      message: `Workflow ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle workflow'
    });
  }
});

// Execute workflow
router.post('/execute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { workflowId, resourceType, resourceId, input } = req.body;

    const workflow = MOCK_WORKFLOWS.find(w => w.id === workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    if (!workflow.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Workflow is not active'
      });
    }

    // Mock execution
    console.log(`Executing workflow ${workflow.name} for ${resourceType} ${resourceId}`);
    
    // Update execution stats
    const workflowIndex = MOCK_WORKFLOWS.findIndex(w => w.id === workflowId);
    MOCK_WORKFLOWS[workflowIndex].executionCount++;
    MOCK_WORKFLOWS[workflowIndex].lastExecuted = new Date();

    res.json({
      success: true,
      message: 'Workflow executed successfully',
      executionId: Date.now().toString(),
      result: {
        workflowId,
        resourceType,
        resourceId,
        status: 'completed',
        executedActions: workflow.actions.length,
        executionTime: Math.random() * 1000 + 500 // Mock execution time
      }
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute workflow'
    });
  }
});

export default router;