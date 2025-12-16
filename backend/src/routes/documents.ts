import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all documents for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.appDocument.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get documents for specific property
router.get('/property/:propertyId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.appDocument.findMany({
      where: {
        propertyId: req.params.propertyId,
        userId: req.userId
      },
      orderBy: { date: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, name, type, data, date, size, logId } = req.body;

    if (!propertyId || !name || !type || !data || !date || size === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: req.userId }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const document = await prisma.appDocument.create({
      data: {
        propertyId,
        userId: req.userId!,
        name,
        type,
        data,
        date,
        size,
        logId: logId || null
      }
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Delete document
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.appDocument.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await prisma.appDocument.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
