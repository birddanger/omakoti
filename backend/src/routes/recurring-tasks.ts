import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Helper function to calculate next due date based on frequency
function calculateNextDueDate(frequency: string, lastDate?: string): string {
  const date = lastDate ? new Date(lastDate) : new Date();
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'biannual':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split('T')[0];
}

// Get recurring tasks for a property
router.get('/:propertyId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = (req as any).userId;

    // Check if user has access to this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { userId: userId },
          {
            propertyAccess: {
              some: {
                userId: userId,
                inviteAccepted: true
              }
            }
          }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await prisma.recurringTask.findMany({
      where: { propertyId },
      orderBy: { nextDueDate: 'asc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    res.status(500).json({ error: 'Failed to fetch recurring tasks' });
  }
});

// Create recurring task
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { propertyId, title, description, frequency, priority, estimatedCost, category } = req.body;
    const userId = (req as any).userId;

    // Check if user has edit access to this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { userId: userId },
          {
            propertyAccess: {
              some: {
                userId: userId,
                role: { in: ['owner', 'admin', 'edit'] },
                inviteAccepted: true
              }
            }
          }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate first next due date
    const nextDueDate = calculateNextDueDate(frequency);

    // Create recurring task
    const recurringTask = await prisma.recurringTask.create({
      data: {
        propertyId,
        userId,
        title,
        description: description || null,
        frequency,
        priority: priority || 'Medium',
        estimatedCost: estimatedCost || null,
        category: category || 'General',
        nextDueDate,
        lastGeneratedDate: null,
        isActive: true
      }
    });

    // Create initial planned task
    const plannedTask = await prisma.plannedTask.create({
      data: {
        propertyId,
        userId,
        title: `${title} (Recurring)`,
        dueDate: nextDueDate,
        priority: priority || 'Medium',
        estimatedCost: estimatedCost || '0',
        status: 'pending'
      }
    });

    res.status(201).json({
      recurringTask,
      plannedTask
    });
  } catch (error) {
    console.error('Error creating recurring task:', error);
    res.status(500).json({ error: 'Failed to create recurring task' });
  }
});

// Update recurring task
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, frequency, priority, estimatedCost, category, isActive } = req.body;
    const userId = (req as any).userId;

    // Verify user has access to this recurring task
    const recurringTask = await prisma.recurringTask.findFirst({
      where: {
        id,
        property: {
          OR: [
            { userId: userId },
            {
              propertyAccess: {
                some: {
                  userId: userId,
                  role: { in: ['owner', 'admin', 'edit'] },
                  inviteAccepted: true
                }
              }
            }
          ]
        }
      }
    });

    if (!recurringTask) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.recurringTask.update({
      where: { id },
      data: {
        title: title || recurringTask.title,
        description: description !== undefined ? description : recurringTask.description,
        frequency: frequency || recurringTask.frequency,
        priority: priority || recurringTask.priority,
        estimatedCost: estimatedCost !== undefined ? estimatedCost : recurringTask.estimatedCost,
        category: category || recurringTask.category,
        isActive: isActive !== undefined ? isActive : recurringTask.isActive
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating recurring task:', error);
    res.status(500).json({ error: 'Failed to update recurring task' });
  }
});

// Delete recurring task
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Verify user has access to this recurring task
    const recurringTask = await prisma.recurringTask.findFirst({
      where: {
        id,
        property: {
          OR: [
            { userId: userId },
            {
              propertyAccess: {
                some: {
                  userId: userId,
                  role: { in: ['owner', 'admin', 'edit'] },
                  inviteAccepted: true
                }
              }
            }
          ]
        }
      }
    });

    if (!recurringTask) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.recurringTask.delete({
      where: { id }
    });

    res.json({ message: 'Recurring task deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    res.status(500).json({ error: 'Failed to delete recurring task' });
  }
});

// Generate planned tasks for active recurring tasks (to be called by a cron job or manually)
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get all active recurring tasks owned by or with edit access by this user
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        isActive: true,
        property: {
          OR: [
            { userId: userId },
            {
              propertyAccess: {
                some: {
                  userId: userId,
                  role: { in: ['owner', 'admin', 'edit'] },
                  inviteAccepted: true
                }
              }
            }
          ]
        }
      }
    });

    const generatedTasks = [];

    for (const task of recurringTasks) {
      const nextDueDate = calculateNextDueDate(task.frequency, task.lastGeneratedDate || undefined);

      // Create planned task
      const plannedTask = await prisma.plannedTask.create({
        data: {
          propertyId: task.propertyId,
          userId: task.userId,
          title: `${task.title} (Recurring)`,
          dueDate: nextDueDate,
          priority: task.priority,
          estimatedCost: task.estimatedCost || '0',
          status: 'pending'
        }
      });

      // Update recurring task's lastGeneratedDate
      await prisma.recurringTask.update({
        where: { id: task.id },
        data: {
          lastGeneratedDate: new Date().toISOString().split('T')[0],
          nextDueDate
        }
      });

      generatedTasks.push(plannedTask);
    }

    res.json({
      message: `Generated ${generatedTasks.length} planned tasks from recurring tasks`,
      tasks: generatedTasks
    });
  } catch (error) {
    console.error('Error generating planned tasks:', error);
    res.status(500).json({ error: 'Failed to generate planned tasks' });
  }
});

export default router;
