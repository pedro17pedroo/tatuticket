import express from 'express';
import { db } from '../db';
import { demoRequests, insertDemoRequestSchema, type InsertDemoRequest, type DemoRequest } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// POST /api/demo-requests - Create new demo request
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validatedData = insertDemoRequestSchema.parse(req.body);
    
    // Create demo request
    const [newDemoRequest] = await db
      .insert(demoRequests)
      .values(validatedData)
      .returning();

    res.status(201).json({
      success: true,
      data: newDemoRequest,
      message: 'Demo request created successfully'
    });
  } catch (error) {
    console.error('Error creating demo request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/demo-requests - List all demo requests (admin only)
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd check if user is admin here
    // For now, we'll assume the request is authorized
    
    const { status, limit = 50, offset = 0 } = req.query;
    
    let baseQuery = db.select().from(demoRequests);
    
    // Build where condition if status filter is provided
    let whereCondition;
    if (status && typeof status === 'string') {
      whereCondition = eq(demoRequests.status, status);
    }
    
    const results = await (whereCondition 
      ? baseQuery.where(whereCondition)
      : baseQuery)
      .orderBy(desc(demoRequests.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get total count for pagination
    const totalCount = await db
      .select({ count: demoRequests.id })
      .from(demoRequests)
      .then(result => result.length);

    res.json({
      success: true,
      data: results,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching demo requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/demo-requests/:id - Get specific demo request
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [demoRequest] = await db
      .select()
      .from(demoRequests)
      .where(eq(demoRequests.id, id));

    if (!demoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demo request not found'
      });
    }

    res.json({
      success: true,
      data: demoRequest
    });
  } catch (error) {
    console.error('Error fetching demo request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/demo-requests/:id - Update demo request (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate update data
    const updateSchema = insertDemoRequestSchema.partial().extend({
      status: z.enum(['pending', 'scheduled', 'completed', 'cancelled']).optional(),
      assignedAdminId: z.string().optional(),
      scheduledDate: z.string().optional(),
      meetingLink: z.string().optional(),
      notes: z.string().optional()
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    // Convert scheduledDate string to Date if provided
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };
    
    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate);
    }

    const [updatedDemoRequest] = await db
      .update(demoRequests)
      .set(updateData)
      .where(eq(demoRequests.id, id))
      .returning();

    if (!updatedDemoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demo request not found'
      });
    }

    res.json({
      success: true,
      data: updatedDemoRequest,
      message: 'Demo request updated successfully'
    });
  } catch (error) {
    console.error('Error updating demo request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/demo-requests/:id - Delete demo request (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedDemoRequest] = await db
      .delete(demoRequests)
      .where(eq(demoRequests.id, id))
      .returning();

    if (!deletedDemoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demo request not found'
      });
    }

    res.json({
      success: true,
      message: 'Demo request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting demo request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;