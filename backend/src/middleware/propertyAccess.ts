import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
  propertyId?: string;
  userRole?: string;
}

// Middleware to check if user has access to a property
export const checkPropertyAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const propertyId = req.params.propertyId || req.params.id;

    if (!userId || !propertyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user owns the property
    const ownedProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: userId
      }
    });

    if (ownedProperty) {
      req.userRole = 'owner';
      return next();
    }

    // Check if user has shared access
    const access = await prisma.propertyAccess.findFirst({
      where: {
        propertyId,
        userId,
        inviteAccepted: true
      }
    });

    if (!access) {
      return res.status(403).json({ error: 'Access denied to this property' });
    }

    req.userRole = access.role;
    next();
  } catch (error) {
    console.error('Error checking property access:', error);
    res.status(500).json({ error: 'Failed to verify access' });
  }
};

// Middleware to check if user has edit/admin access
export const requireEditAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRole = req.userRole;

    if (!['owner', 'admin', 'edit'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }

    next();
  } catch (error) {
    console.error('Error checking edit access:', error);
    res.status(500).json({ error: 'Failed to verify permissions' });
  }
};

// Middleware to check if user has admin/owner access
export const requireAdminAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRole = req.userRole;

    if (!['owner', 'admin'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin access:', error);
    res.status(500).json({ error: 'Failed to verify permissions' });
  }
};
