import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ChecklistItem } from '../types.js';

const router = Router();
const prisma = new PrismaClient();

// Pre-made seasonal checklist templates
const SEASONAL_TEMPLATES: Record<string, ChecklistItem[]> = {
  Spring: [
    { id: '1', title: 'Inspect and repair roof', completed: false },
    { id: '2', title: 'Clean gutters and downspouts', completed: false },
    { id: '3', title: 'Check exterior caulking and sealant', completed: false },
    { id: '4', title: 'Inspect deck or patio for damage', completed: false },
    { id: '5', title: 'Check HVAC system before summer', completed: false },
    { id: '6', title: 'Service air conditioning unit', completed: false },
    { id: '7', title: 'Check basement/crawlspace for water damage', completed: false },
    { id: '8', title: 'Inspect windows for leaks', completed: false },
  ],
  Summer: [
    { id: '1', title: 'Power wash exterior surfaces', completed: false },
    { id: '2', title: 'Stain or seal deck/patio', completed: false },
    { id: '3', title: 'Check exterior paint for peeling', completed: false },
    { id: '4', title: 'Inspect landscaping drainage', completed: false },
    { id: '5', title: 'Clean and inspect septic system (if applicable)', completed: false },
    { id: '6', title: 'Check and repair fencing', completed: false },
    { id: '7', title: 'Inspect foundation for cracks', completed: false },
    { id: '8', title: 'Service well pump (if applicable)', completed: false },
  ],
  Fall: [
    { id: '1', title: 'Clean leaves from gutters', completed: false },
    { id: '2', title: 'Inspect chimney and have it swept', completed: false },
    { id: '3', title: 'Service heating system before winter', completed: false },
    { id: '4', title: 'Weatherize windows and doors', completed: false },
    { id: '5', title: 'Drain and store garden hoses', completed: false },
    { id: '6', title: 'Inspect exterior grading and drainage', completed: false },
    { id: '7', title: 'Check attic for leaks and ventilation', completed: false },
    { id: '8', title: 'Trim tree branches near roof and utilities', completed: false },
  ],
  Winter: [
    { id: '1', title: 'Monitor ice dams on roof', completed: false },
    { id: '2', title: 'Check for gaps around utilities entering home', completed: false },
    { id: '3', title: 'Inspect basement for water seepage', completed: false },
    { id: '4', title: 'Check weatherstripping on doors', completed: false },
    { id: '5', title: 'Monitor heating system performance', completed: false },
    { id: '6', title: 'Check for signs of pests', completed: false },
    { id: '7', title: 'Inspect pipes for freezing risks', completed: false },
    { id: '8', title: 'Check attic insulation adequacy', completed: false },
  ]
};

// Get checklists for a property
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

    const checklists = await prisma.seasonalChecklist.findMany({
      where: { propertyId },
      orderBy: { season: 'asc' }
    });

    const formattedChecklists = checklists.map(cl => ({
      id: cl.id,
      propertyId: cl.propertyId,
      season: cl.season,
      items: JSON.parse(cl.items),
      lastUpdated: cl.updatedAt.toISOString()
    }));

    res.json(formattedChecklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

// Initialize seasonal checklists with templates for a property
router.post('/initialize/:propertyId', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Create checklists for all seasons
    const created = [];
    for (const [season, items] of Object.entries(SEASONAL_TEMPLATES)) {
      const existing = await prisma.seasonalChecklist.findUnique({
        where: {
          propertyId_season: {
            propertyId,
            season
          }
        }
      });

      if (!existing) {
        const checklist = await prisma.seasonalChecklist.create({
          data: {
            propertyId,
            season,
            items: JSON.stringify(items)
          }
        });
        created.push({
          id: checklist.id,
          propertyId: checklist.propertyId,
          season: checklist.season,
          items: JSON.parse(checklist.items),
          lastUpdated: checklist.updatedAt.toISOString()
        });
      }
    }

    res.status(201).json(created);
  } catch (error) {
    console.error('Error initializing checklists:', error);
    res.status(500).json({ error: 'Failed to initialize checklists' });
  }
});

// Update checklist items
router.put('/:checklistId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { checklistId } = req.params;
    const { items } = req.body;
    const userId = req.user?.id;

    if (!userId || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get checklist and verify access
    const checklist = await prisma.seasonalChecklist.findUnique({
      where: { id: checklistId },
      include: { property: true }
    });

    if (!checklist || checklist.property.userId !== userId) {
      return res.status(403).json({ error: 'Checklist not found or access denied' });
    }

    const updated = await prisma.seasonalChecklist.update({
      where: { id: checklistId },
      data: {
        items: JSON.stringify(items)
      }
    });

    res.json({
      id: updated.id,
      propertyId: updated.propertyId,
      season: updated.season,
      items: JSON.parse(updated.items),
      lastUpdated: updated.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

// Delete a checklist
router.delete('/:checklistId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { checklistId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get checklist and verify access
    const checklist = await prisma.seasonalChecklist.findUnique({
      where: { id: checklistId },
      include: { property: true }
    });

    if (!checklist || checklist.property.userId !== userId) {
      return res.status(403).json({ error: 'Checklist not found or access denied' });
    }

    await prisma.seasonalChecklist.delete({
      where: { id: checklistId }
    });

    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
});

export default router;
