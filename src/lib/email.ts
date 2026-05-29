import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/* ── Shared brand values ─────────────────────────────────────────────── */
const BG        = '#09090b';
const CARD      = '#111111';
const BORDER    = '#1f1f1f';
const TEXT      = '#e4e4e7';
const MUTED     = '#71717a';
const WHITE     = '#ffffff';

/* ── Shared layout shell ─────────────────────────────────────────────── */
function shell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OY Labs</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Wordmark -->
        <tr><td style="padding-bottom:32px;">
          <span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:${WHITE};">OY</span><span style="font-size:12px;font-weight:300;letter-spacing:0.25em;color:${MUTED};margin-left:6px;">LABS</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:36px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:28px;">
          <p style="margin:0;font-size:11px;color:#3f3f46;letter-spacing:0.05em;">
            OY LABS &nbsp;·&nbsp; oylabs.co &nbsp;·&nbsp; hi@oylabs.co
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── 1. Notification email → hi@oylabs.co ────────────────────────────── */
export function buildNotificationEmail(data: {
  name:        string;
  email:       string;
  projectType: string;
  brief:       string;
}): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;width:120px;">
        <span style="font-size:10px;color:${MUTED};letter-spacing:0.2em;text-transform:uppercase;">${label}</span>
      </td>
      <td style="padding:12px 0 12px 20px;border-bottom:1px solid ${BORDER};vertical-align:top;">
        <span style="font-size:14px;color:${TEXT};">${value}</span>
      </td>
    </tr>`;

  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:${MUTED};letter-spacing:0.2em;text-transform:uppercase;">New Enquiry</p>
    <h1 style="margin:0 0 28px;font-size:22px;font-weight:700;color:${WHITE};letter-spacing:-0.02em;line-height:1.2;">
      Brief from ${escHtml(data.name)}
    </h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BORDER};">
      ${row('Name',    escHtml(data.name))}
      ${row('Email',   `<a href="mailto:${escHtml(data.email)}" style="color:${WHITE};text-decoration:none;">${escHtml(data.email)}</a>`)}
      ${row('Type',    escHtml(data.projectType))}
      ${row('Brief',   `<span style="line-height:1.6;">${escHtml(data.brief).replace(/\n/g, '<br/>')}</span>`)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr><td>
        <a href="mailto:${escHtml(data.email)}"
           style="display:inline-block;background:${WHITE};color:#000;font-size:13px;font-weight:600;letter-spacing:0.05em;padding:11px 24px;border-radius:100px;text-decoration:none;">
          Reply to ${escHtml(data.name)}
        </a>
      </td></tr>
    </table>`;

  return shell(body);
}

/* ── 2. Confirmation email → submitter ──────────────────────────────── */
export function buildConfirmationEmail(data: {
  name:        string;
  projectType: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;font-size:11px;color:${MUTED};letter-spacing:0.2em;text-transform:uppercase;">Brief Received</p>
    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${WHITE};letter-spacing:-0.03em;line-height:1.2;">
      We'll be in touch,<br/>${escHtml(data.name)}.
    </h1>

    <p style="margin:0 0 28px;font-size:14px;color:${MUTED};line-height:1.7;">
      Your brief has landed with the team. We scope every engagement carefully before writing a single line of code, so expect a considered response — not a template.
    </p>

    <!-- Divider -->
    <div style="height:1px;background:${BORDER};margin-bottom:28px;"></div>

    <!-- Summary card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid ${BORDER};border-radius:10px;padding:20px;">
      <tr>
        <td style="padding:0 0 16px;">
          <span style="font-size:10px;color:#3f3f46;letter-spacing:0.2em;text-transform:uppercase;">Your submission</span>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 8px;">
          <span style="font-size:11px;color:${MUTED};letter-spacing:0.1em;text-transform:uppercase;">Project type</span>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 0;">
          <span style="font-size:14px;color:${TEXT};">${escHtml(data.projectType)}</span>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;font-size:13px;color:${MUTED};line-height:1.7;">
      Typical response time is <span style="color:${TEXT};font-weight:500;">under 24 hours</span>. If it's urgent, reply to this email or reach us directly at
      <a href="mailto:hi@oylabs.co" style="color:${WHITE};text-decoration:none;">hi@oylabs.co</a>.
    </p>

    <!-- Divider -->
    <div style="height:1px;background:${BORDER};margin:28px 0;"></div>

    <p style="margin:0;font-size:12px;color:#3f3f46;">
      — OY Labs
    </p>`;

  return shell(body);
}

/* ── Send helpers ────────────────────────────────────────────────────── */
export async function sendContactEmails(data: {
  name:        string;
  email:       string;
  projectType: string;
  brief:       string;
}) {
  const [notif, confirm] = await Promise.all([
    /* Notify the team */
    resend.emails.send({
      from:    'OY Labs <noreply@oylabs.co>',
      to:      ['hi@oylabs.co'],
      replyTo: data.email,
      subject: `New brief from ${data.name} — ${data.projectType}`,
      html:    buildNotificationEmail(data),
    }),
    /* Confirm to the user */
    resend.emails.send({
      from:    'OY Labs <noreply@oylabs.co>',
      to:      [data.email],
      subject: 'Brief received — OY Labs',
      html:    buildConfirmationEmail(data),
    }),
  ]);

  return { notif, confirm };
}

/* ── Utility ─────────────────────────────────────────────────────────── */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
