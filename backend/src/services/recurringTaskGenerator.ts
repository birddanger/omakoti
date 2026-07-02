import { PrismaClient } from '@prisma/client';

/**
 * Advance a date string (YYYY-MM-DD) by one interval of the given frequency.
 */
export function advanceDate(frequency: string, fromDate: string): string {
  const date = new Date(fromDate);

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

export interface GeneratedTaskSummary {
  recurringTaskId: string;
  plannedTaskId: string;
  propertyId: string;
  title: string;
  dueDate: string;
}

/**
 * Generate PlannedTasks for every active RecurringTask whose nextDueDate has
 * arrived (nextDueDate <= today). Unlike a naive generator, this:
 *   - only materialises tasks that are actually due,
 *   - skips creation if an identical pending PlannedTask already exists (dedup),
 *   - rolls nextDueDate forward past today so a single run catches up any
 *     missed cycles without spamming duplicate tasks.
 *
 * An optional `recurringTaskIds` filter restricts generation to a specific set
 * (used by the user-triggered "generate now" endpoint).
 */
export async function generateDueRecurringTasks(
  prisma: PrismaClient,
  options: { recurringTaskIds?: string[] } = {}
): Promise<GeneratedTaskSummary[]> {
  const today = new Date().toISOString().split('T')[0];

  const recurringTasks = await prisma.recurringTask.findMany({
    where: {
      isActive: true,
      nextDueDate: { lte: today },
      ...(options.recurringTaskIds ? { id: { in: options.recurringTaskIds } } : {}),
    },
  });

  const generated: GeneratedTaskSummary[] = [];

  for (const task of recurringTasks) {
    const dueDate = task.nextDueDate;

    // Dedup: don't create a second pending task for the same recurring task
    // and due date if generation runs more than once.
    const existing = await prisma.plannedTask.findFirst({
      where: {
        propertyId: task.propertyId,
        title: `${task.title} (Recurring)`,
        dueDate,
        status: 'pending',
      },
    });

    let plannedTaskId: string;
    if (existing) {
      plannedTaskId = existing.id;
    } else {
      const plannedTask = await prisma.plannedTask.create({
        data: {
          propertyId: task.propertyId,
          userId: task.userId,
          title: `${task.title} (Recurring)`,
          dueDate,
          priority: task.priority,
          estimatedCost: task.estimatedCost || '0',
          status: 'pending',
        },
      });
      plannedTaskId = plannedTask.id;
      generated.push({
        recurringTaskId: task.id,
        plannedTaskId,
        propertyId: task.propertyId,
        title: task.title,
        dueDate,
      });
    }

    // Roll nextDueDate forward until it's in the future, catching up any
    // cycles that were missed while the scheduler was offline.
    let nextDueDate = advanceDate(task.frequency, dueDate);
    let guard = 0;
    while (nextDueDate <= today && guard < 520) {
      nextDueDate = advanceDate(task.frequency, nextDueDate);
      guard++;
    }

    await prisma.recurringTask.update({
      where: { id: task.id },
      data: {
        lastGeneratedDate: today,
        nextDueDate,
      },
    });
  }

  return generated;
}
