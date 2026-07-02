import { PrismaClient } from '@prisma/client';
import { runReminderScan } from './services/reminderService.js';

// Daily schedule (server local time). Overridable via REMINDER_CRON.
const CRON_EXPRESSION = process.env.REMINDER_CRON || '0 7 * * *'; // 07:00 every day

async function scan(prisma: PrismaClient) {
  try {
    const result = await runReminderScan(prisma);
    console.log(
      `[scheduler] reminder scan complete: ${result.generatedRecurringTasks} recurring task(s) generated, ${result.notificationsCreated} notification(s) created`
    );
  } catch (err) {
    console.error('[scheduler] reminder scan failed:', err);
  }
}

/**
 * Start the daily reminder scan. Uses node-cron when available; otherwise falls
 * back to a 24h interval so the feature still works with zero extra deps.
 */
export async function startScheduler(prisma: PrismaClient): Promise<void> {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    console.log('[scheduler] disabled via DISABLE_SCHEDULER');
    return;
  }

  // Run once shortly after boot so a freshly started server catches up.
  setTimeout(() => scan(prisma), 10_000);

  try {
    // @ts-ignore - optional dependency
    const cron = await import('node-cron');
    cron.schedule(CRON_EXPRESSION, () => scan(prisma));
    console.log(`[scheduler] reminder scan scheduled (cron: "${CRON_EXPRESSION}")`);
  } catch {
    console.warn('[scheduler] node-cron not installed, falling back to 24h interval');
    setInterval(() => scan(prisma), 24 * 60 * 60 * 1000);
  }
}
