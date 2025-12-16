import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all properties for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create property
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, type, yearBuilt, area, heatingType, floors, purchaseDate, description } = req.body;

    if (!name || !address || !type || yearBuilt === undefined || !area || !heatingType || floors === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const property = await prisma.property.create({
      data: {
        userId: req.userId!,
        name,
        address,
        type,
        yearBuilt,
        area,
        heatingType,
        floors,
        purchaseDate,
        description
      }
    });

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await prisma.property.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export default router;
