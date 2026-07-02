// Optional email delivery for reminders.
//
// This is intentionally best-effort: if SMTP env vars are not configured (or the
// optional `nodemailer` dependency isn't installed) it becomes a no-op so the
// in-app notification system still works on its own.

let transporter: any = null;
let initialized = false;

async function getTransporter(): Promise<any | null> {
  if (initialized) return transporter;
  initialized = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  try {
    // Dynamically imported so the app runs even when nodemailer isn't installed.
    // @ts-ignore - optional dependency
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: parseInt(SMTP_PORT || '587', 10) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return transporter;
  } catch (err) {
    console.warn('[email] nodemailer not available, email disabled:', (err as Error).message);
    return null;
  }
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const tx = await getTransporter();
  if (!tx) return false;

  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('[email] failed to send:', (err as Error).message);
    return false;
  }
}

export function isEmailEnabled(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
