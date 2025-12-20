import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
}

// Get all users with access to a property
router.get('/properties/:propertyId/access', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId;

    // Verify user has access to this property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { propertyAccess: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if user is owner or admin
    const access = property.propertyAccess.find(a => a.userId === userId);
    if (!access || !['owner', 'admin'].includes(access.role)) {
      return res.status(403).json({ error: 'Not authorized to view access' });
    }

    res.json({
      propertyId,
      access: property.propertyAccess.map(a => ({
        id: a.id,
        userId: a.userId,
        name: a.user?.name || 'Pending',
        email: a.user?.email || a.inviteEmail,
        role: a.role,
        inviteEmail: a.inviteEmail,
        inviteAccepted: a.inviteAccepted,
        invitedAt: a.invitedAt,
        acceptedAt: a.acceptedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching access list:', error);
    res.status(500).json({ error: 'Failed to fetch access list' });
  }
});

// Share property with a family member (email)
router.post('/properties/:propertyId/share', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { email, role } = req.body;
    const userId = req.userId;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!['admin', 'edit', 'view'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify property exists and user is owner/admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { propertyAccess: { include: { user: true } } }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const userAccess = property.propertyAccess.find(a => a.userId === userId);
    if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to share property' });
    }

    // Check if user already has access
    const existingAccess = property.propertyAccess.find(
      a => a.user?.email === email || a.inviteEmail === email
    );

    if (existingAccess) {
      return res.status(400).json({ error: 'User already has access to this property' });
    }

    // Find if email belongs to existing user
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (targetUser) {
      // User exists, grant direct access
      const access = await prisma.propertyAccess.create({
        data: {
          propertyId,
          userId: targetUser.id,
          role,
          inviteAccepted: true,
          acceptedAt: new Date()
        },
        include: { user: { select: { id: true, name: true, email: true } } }
      });

      return res.status(201).json({
        id: access.id,
        userId: access.userId,
        name: access.user!.name,
        email: access.user!.email,
        role: access.role,
        inviteAccepted: access.inviteAccepted
      });
    } else {
      // User doesn't exist yet, create pending invitation
      const access = await prisma.propertyAccess.create({
        data: {
          propertyId,
          inviteEmail: email,
          role,
          inviteAccepted: false
        }
      });

      res.status(201).json({
        id: access.id,
        inviteEmail: access.inviteEmail,
        role: access.role,
        inviteAccepted: access.inviteAccepted,
        message: 'Invitation pending - user will gain access once they sign up with this email'
      });
    }
  } catch (error) {
    console.error('Error sharing property:', error);
    res.status(500).json({ error: 'Failed to share property' });
  }
});

// Update permission level for a user
router.put('/properties/:propertyId/access/:accessId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, accessId } = req.params;
    const { role } = req.body;
    const userId = req.userId;

    if (!role || !['admin', 'edit', 'view'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify user is owner or admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { propertyAccess: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const userAccess = property.propertyAccess.find(a => a.userId === userId);
    if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to modify access' });
    }

    // Can't downgrade owner
    const targetAccess = property.propertyAccess.find(a => a.id === accessId);
    if (!targetAccess) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    if (targetAccess.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner permissions' });
    }

    const updated = await prisma.propertyAccess.update({
      where: { id: accessId },
      data: { role }
    });

    res.json({ message: 'Permission updated', role: updated.role });
  } catch (error) {
    console.error('Error updating access:', error);
    res.status(500).json({ error: 'Failed to update access' });
  }
});

// Remove access for a user
router.delete('/properties/:propertyId/access/:accessId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, accessId } = req.params;
    const userId = req.userId;

    // Verify user is owner or admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { propertyAccess: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const userAccess = property.propertyAccess.find(a => a.userId === userId);
    if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to remove access' });
    }

    // Can't remove owner
    const targetAccess = property.propertyAccess.find(a => a.id === accessId);
    if (!targetAccess) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    if (targetAccess.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove owner access' });
    }

    await prisma.propertyAccess.delete({
      where: { id: accessId }
    });

    res.json({ message: 'Access removed' });
  } catch (error) {
    console.error('Error removing access:', error);
    res.status(500).json({ error: 'Failed to remove access' });
  }
});

// Get all properties accessible to current user (including shared)
router.get('/properties/accessible/all', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const accessRecords = await prisma.propertyAccess.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            type: true,
            userId: true
          }
        }
      }
    });

    const properties = accessRecords.map(a => ({
      ...a.property,
      role: a.role,
      isOwner: a.property!.userId === userId
    }));

    res.json(properties);
  } catch (error) {
    console.error('Error fetching accessible properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

export default router;
