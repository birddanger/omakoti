import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all appliances for a property
router.get('/:propertyId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify property belongs to user
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.userId !== userId) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    const appliances = await prisma.appliance.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(appliances);
  } catch (error) {
    console.error('Error fetching appliances:', error);
    res.status(500).json({ error: 'Failed to fetch appliances' });
  }
});

// Create a new appliance
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, type, modelNumber, yearInstalled, monthInstalled } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!propertyId || !type || !yearInstalled || monthInstalled === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify property belongs to user
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property || property.userId !== userId) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    const appliance = await prisma.appliance.create({
      data: {
        propertyId,
        type,
        modelNumber: modelNumber || undefined,
        yearInstalled: parseInt(yearInstalled),
        monthInstalled: parseInt(monthInstalled)
      }
    });

    res.status(201).json(appliance);
  } catch (error) {
    console.error('Error creating appliance:', error);
    res.status(500).json({ error: 'Failed to create appliance' });
  }
});

// Delete an appliance
router.delete('/:applianceId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { applianceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get appliance with its property
    const appliance = await prisma.appliance.findUnique({
      where: { id: applianceId },
      include: { property: true }
    });

    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }

    // Verify property belongs to user
    if (appliance.property.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.appliance.delete({
      where: { id: applianceId }
    });

    res.json({ message: 'Appliance deleted successfully' });
  } catch (error) {
    console.error('Error deleting appliance:', error);
    res.status(500).json({ error: 'Failed to delete appliance' });
  }
});

// Update an appliance
router.put('/:applianceId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { applianceId } = req.params;
    const { type, modelNumber, yearInstalled, monthInstalled } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get appliance with its property
    const appliance = await prisma.appliance.findUnique({
      where: { id: applianceId },
      include: { property: true }
    });

    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }

    // Verify property belongs to user
    if (appliance.property.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.appliance.update({
      where: { id: applianceId },
      data: {
        type: type || appliance.type,
        modelNumber: modelNumber !== undefined ? modelNumber : appliance.modelNumber,
        yearInstalled: yearInstalled !== undefined ? parseInt(yearInstalled) : appliance.yearInstalled,
        monthInstalled: monthInstalled !== undefined ? parseInt(monthInstalled) : appliance.monthInstalled
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating appliance:', error);
    res.status(500).json({ error: 'Failed to update appliance' });
  }
});

export default router;
