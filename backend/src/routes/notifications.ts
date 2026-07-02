import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { runReminderScan } from '../services/reminderService.js';

const router = Router();
const prisma = new PrismaClient();

// List notifications for the current user (newest first).
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, isRead: false },
    });
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a single notification as read.
router.post('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all of the user's notifications as read.
router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete a notification.
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.delete({ where: { id: notification.id } });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Trigger a reminder scan on demand (useful for testing / a "check now" button).
router.post('/scan', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await runReminderScan(prisma);
    res.json(result);
  } catch (error) {
    console.error('Error running reminder scan:', error);
    res.status(500).json({ error: 'Failed to run reminder scan' });
  }
});

export default router;
