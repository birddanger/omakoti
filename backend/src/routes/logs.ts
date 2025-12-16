import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all logs for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get logs for specific property
router.get('/property/:propertyId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: {
        propertyId: req.params.propertyId,
        userId: req.userId
      },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create log
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, title, date, cost, provider, category, notes } = req.body;

    if (!propertyId || !title || !date || cost === undefined || !category) {
      return res.status(400).json({ error: 'Missing required fields: propertyId, title, date, cost, category' });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: req.userId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        propertyId,
        userId: req.userId!,
        title,
        date,
        cost: parseFloat(cost.toString()),
        provider: provider || 'Unknown',
        category,
        notes: notes || ''
      }
    });

    res.status(201).json(log);
  } catch (error: any) {
    console.error('Error creating log:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to create log' });
  }
});

// Update log
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const log = await prisma.maintenanceLog.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    const updated = await prisma.maintenanceLog.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// Delete log
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const log = await prisma.maintenanceLog.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    await prisma.maintenanceLog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

export default router;
