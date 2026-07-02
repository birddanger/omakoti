import { PrismaClient } from '@prisma/client';
import { generateDueRecurringTasks } from './recurringTaskGenerator.js';
import { sendEmail, isEmailEnabled } from './email.js';

// How far ahead we warn about upcoming tasks / expiring warranties.
const DUE_SOON_DAYS = 7;
const WARRANTY_WINDOW_DAYS = 30;

interface Recipient {
  userId: string;
  email: string;
  name: string;
}

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Everyone who should be reminded about a property: the owner plus any users
 * with an accepted access grant.
 */
async function getPropertyRecipients(prisma: PrismaClient, propertyId: string): Promise<Recipient[]> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      user: true,
      propertyAccess: {
        where: { inviteAccepted: true, userId: { not: null } },
        include: { user: true },
      },
    },
  });
  if (!property) return [];

  const byId = new Map<string, Recipient>();
  byId.set(property.user.id, {
    userId: property.user.id,
    email: property.user.email,
    name: property.user.name,
  });
  for (const access of property.propertyAccess) {
    if (access.user) {
      byId.set(access.user.id, {
        userId: access.user.id,
        email: access.user.email,
        name: access.user.name,
      });
    }
  }
  return Array.from(byId.values());
}

/**
 * Create (or refresh) a notification without clobbering its read state.
 * De-duplicated per user via the (userId, dedupeKey) unique constraint.
 */
async function upsertNotification(
  prisma: PrismaClient,
  data: {
    userId: string;
    propertyId?: string | null;
    type: string;
    severity: string;
    title: string;
    message: string;
    relatedId?: string | null;
    dueDate?: string | null;
    dedupeKey: string;
  }
): Promise<boolean> {
  const existing = await prisma.notification.findUnique({
    where: { userId_dedupeKey: { userId: data.userId, dedupeKey: data.dedupeKey } },
  });

  await prisma.notification.upsert({
    where: { userId_dedupeKey: { userId: data.userId, dedupeKey: data.dedupeKey } },
    create: {
      userId: data.userId,
      propertyId: data.propertyId ?? null,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId ?? null,
      dueDate: data.dueDate ?? null,
      dedupeKey: data.dedupeKey,
    },
    // Refresh the human-facing fields but never reset isRead.
    update: {
      severity: data.severity,
      title: data.title,
      message: data.message,
      dueDate: data.dueDate ?? null,
    },
  });

  return !existing; // true when this is a brand-new notification
}

export interface ReminderScanResult {
  generatedRecurringTasks: number;
  notificationsCreated: number;
}

/**
 * The heart of the reminder engine. Run daily by the scheduler (and exposed via
 * an admin endpoint for manual/testing runs). It:
 *   1. materialises any due recurring tasks,
 *   2. notifies about overdue and soon-due planned tasks,
 *   3. notifies about warranties nearing expiry,
 * emailing recipients when SMTP is configured.
 */
export async function runReminderScan(prisma: PrismaClient): Promise<ReminderScanResult> {
  const today = toDateOnly(new Date());
  const horizon = toDateOnly(new Date(Date.now() + DUE_SOON_DAYS * 86400000));
  const warrantyHorizon = toDateOnly(new Date(Date.now() + WARRANTY_WINDOW_DAYS * 86400000));

  let notificationsCreated = 0;
  const emailQueue: { email: string; subject: string; body: string }[] = [];

  // 1. Generate due recurring tasks and announce them.
  const generated = await generateDueRecurringTasks(prisma);
  for (const g of generated) {
    const recipients = await getPropertyRecipients(prisma, g.propertyId);
    for (const r of recipients) {
      const isNew = await upsertNotification(prisma, {
        userId: r.userId,
        propertyId: g.propertyId,
        type: 'recurring_generated',
        severity: 'info',
        title: 'New recurring task',
        message: `"${g.title}" is now due (${g.dueDate}).`,
        relatedId: g.plannedTaskId,
        dueDate: g.dueDate,
        dedupeKey: `recurring:${g.plannedTaskId}`,
      });
      if (isNew) {
        notificationsCreated++;
        emailQueue.push({
          email: r.email,
          subject: `New maintenance task due: ${g.title}`,
          body: `Hi ${r.name},\n\nA recurring maintenance task "${g.title}" is now due (${g.dueDate}).`,
        });
      }
    }
  }

  // 2. Overdue and soon-due planned tasks.
  const upcomingTasks = await prisma.plannedTask.findMany({
    where: { status: 'pending', dueDate: { lte: horizon } },
  });
  for (const task of upcomingTasks) {
    const overdue = task.dueDate < today;
    const recipients = await getPropertyRecipients(prisma, task.propertyId);
    for (const r of recipients) {
      const isNew = await upsertNotification(prisma, {
        userId: r.userId,
        propertyId: task.propertyId,
        type: overdue ? 'task_overdue' : 'task_due',
        severity: overdue ? 'urgent' : 'warning',
        title: overdue ? 'Task overdue' : 'Task due soon',
        message: overdue
          ? `"${task.title}" was due ${task.dueDate}.`
          : `"${task.title}" is due ${task.dueDate}.`,
        relatedId: task.id,
        dueDate: task.dueDate,
        dedupeKey: `task:${task.id}:${overdue ? 'overdue' : 'due'}`,
      });
      if (isNew) {
        notificationsCreated++;
        emailQueue.push({
          email: r.email,
          subject: `${overdue ? 'Overdue' : 'Upcoming'} maintenance: ${task.title}`,
          body: `Hi ${r.name},\n\nThe task "${task.title}" is ${overdue ? 'overdue' : `due on ${task.dueDate}`}.`,
        });
      }
    }
  }

  // 3. Warranties nearing expiry.
  const warranties = await prisma.warranty.findMany({
    where: { expirationDate: { lte: warrantyHorizon, gte: today } },
    include: { appliance: true },
  });
  for (const w of warranties) {
    if (!w.appliance) continue;
    const daysLeft = daysBetween(today, w.expirationDate);
    const recipients = await getPropertyRecipients(prisma, w.appliance.propertyId);
    for (const r of recipients) {
      const isNew = await upsertNotification(prisma, {
        userId: r.userId,
        propertyId: w.appliance.propertyId,
        type: 'warranty_expiring',
        severity: daysLeft <= 7 ? 'urgent' : 'warning',
        title: 'Warranty expiring',
        message: `Warranty for ${w.appliance.type} (${w.provider}) expires ${w.expirationDate}.`,
        relatedId: w.id,
        dueDate: w.expirationDate,
        dedupeKey: `warranty:${w.id}`,
      });
      if (isNew) {
        notificationsCreated++;
        emailQueue.push({
          email: r.email,
          subject: `Warranty expiring soon: ${w.appliance.type}`,
          body: `Hi ${r.name},\n\nThe warranty for your ${w.appliance.type} (${w.provider}) expires on ${w.expirationDate} (${daysLeft} days).`,
        });
      }
    }
  }

  // Fire off emails (best-effort, non-blocking of the DB work).
  if (isEmailEnabled()) {
    for (const mail of emailQueue) {
      await sendEmail(mail.email, mail.subject, mail.body);
    }
  }

  return {
    generatedRecurringTasks: generated.length,
    notificationsCreated,
  };
}
