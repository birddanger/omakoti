import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all planned tasks for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.plannedTask.findMany({
      where: { userId: req.userId },
      orderBy: { dueDate: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks for specific property
router.get('/property/:propertyId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.plannedTask.findMany({
      where: {
        propertyId: req.params.propertyId,
        userId: req.userId
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, title, dueDate, priority, estimatedCost } = req.body;

    if (!propertyId || !title || !dueDate || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: req.userId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const task = await prisma.plannedTask.create({
      data: {
        propertyId,
        userId: req.userId!,
        title,
        dueDate,
        priority,
        estimatedCost: estimatedCost || '',
        status: 'pending'
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.plannedTask.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.plannedTask.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Complete task (mark as completed)
router.patch('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.plannedTask.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.plannedTask.update({
      where: { id: req.params.id },
      data: { status: 'completed' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.plannedTask.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.plannedTask.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
