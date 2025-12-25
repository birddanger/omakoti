import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get warranties for a specific property
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
      },
      include: {
        appliances: {
          include: {
            warranty: {
              include: {
                document: true
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Extract warranties from appliances
    const warranties = property.appliances
      .filter(appliance => appliance.warranty)
      .map(appliance => appliance.warranty);

    res.json(warranties);
  } catch (error) {
    console.error('Error fetching warranties:', error);
    res.status(500).json({ error: 'Failed to fetch warranties' });
  }
});

// Get warranty for a specific appliance
router.get('/appliance/:applianceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { applianceId } = req.params;
    const userId = (req as any).userId;

    // Verify user has access to this appliance's property
    const appliance = await prisma.appliance.findFirst({
      where: {
        id: applianceId,
        property: {
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
      },
      include: {
        warranty: {
          include: {
            document: true
          }
        }
      }
    });

    if (!appliance) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(appliance.warranty);
  } catch (error) {
    console.error('Error fetching warranty:', error);
    res.status(500).json({ error: 'Failed to fetch warranty' });
  }
});

// Create warranty for an appliance
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { applianceId, provider, expirationDate, coverageDetails } = req.body;
    const userId = (req as any).userId;

    // Verify user has access to this appliance's property
    const appliance = await prisma.appliance.findFirst({
      where: {
        id: applianceId,
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

    if (!appliance) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if warranty already exists for this appliance
    const existingWarranty = await prisma.warranty.findFirst({
      where: { applianceId }
    });

    if (existingWarranty) {
      return res.status(400).json({ error: 'Warranty already exists for this appliance' });
    }

    const warranty = await prisma.warranty.create({
      data: {
        applianceId,
        provider,
        expirationDate,
        coverageDetails: coverageDetails || null
      },
      include: {
        document: true
      }
    });

    res.status(201).json(warranty);
  } catch (error) {
    console.error('Error creating warranty:', error);
    res.status(500).json({ error: 'Failed to create warranty' });
  }
});

// Update warranty
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { provider, expirationDate, coverageDetails } = req.body;
    const userId = (req as any).userId;

    // Verify user has access to this warranty
    const warranty = await prisma.warranty.findFirst({
      where: {
        id,
        appliance: {
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
      }
    });

    if (!warranty) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.warranty.update({
      where: { id },
      data: {
        provider: provider || warranty.provider,
        expirationDate: expirationDate || warranty.expirationDate,
        coverageDetails: coverageDetails !== undefined ? coverageDetails : warranty.coverageDetails
      },
      include: {
        document: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating warranty:', error);
    res.status(500).json({ error: 'Failed to update warranty' });
  }
});

// Delete warranty
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Verify user has access to this warranty
    const warranty = await prisma.warranty.findFirst({
      where: {
        id,
        appliance: {
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
      }
    });

    if (!warranty) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.warranty.delete({
      where: { id }
    });

    res.json({ message: 'Warranty deleted successfully' });
  } catch (error) {
    console.error('Error deleting warranty:', error);
    res.status(500).json({ error: 'Failed to delete warranty' });
  }
});

export default router;
