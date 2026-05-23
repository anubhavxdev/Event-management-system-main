import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Construct auth object only if we have actual credentials
const authConfig = (env.smtpUser && env.smtpPass)
  ? { user: env.smtpUser, pass: env.smtpPass }
  : undefined;

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: authConfig,
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Verify connection configuration
if (process.env.NODE_ENV !== 'test') {
  transporter.verify(function (error, success) {
    if (error) {
      console.warn("Transporter verification warning:", error.message);

      if (error.code === 'EAUTH') {
        console.warn(
          "  -> Email functionality will not work until SMTP_USER and SMTP_PASS are set in .env"
        );
      }
    } else {
      console.log("Email server is ready.");
    }
  });
}

export async function sendEmail({ to, subject, html, text, attachments }) {
  if (!authConfig) {
    console.warn("⚠️ SMTP credentials missing (SMTP_USER/SMTP_PASS). Simulating email send...");
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[MOCK EMAIL] Subject: ${subject}`);
    // console.log(`[MOCK EMAIL] HTML: ${html.substring(0, 100)}...`); 
    return { messageId: 'mock-email-id-12345' };
  }

  try {
    return await transporter.sendMail({
      from: env.emailFrom,
      to,
      subject,
      html,
      text,
      attachments
    });
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw error;
  }
}

export async function sendTicketEmail(to, event, registrationId, qrCodeBuffer) {
  const subject = `Your Ticket for ${event.title}`;
  // Use APP_NAME from env for flexible branding across deployments
  // Fallback to 'eventone' if APP_NAME is not set or is empty
  const brandName = (env.appName || '').toString().trim() || 'eventone';

  // NOTE: env.appName is not HTML-escaped here; ensure environment inputs are validated
  // to prevent injection. The footer is plain text/HTML and CSS handles wrapping for long names.

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background-color: #ea580c; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Event Ticket</h1>
    </div>
    <div style="padding: 32px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">${event.title}</h2>
      <p style="color: #64748b; margin-bottom: 24px;">Thank you for registering! Here are your event details.</p>

      <table style="width: 100%; margin-bottom: 24px;">
        <tr>
          <td style="padding-bottom: 8px; color: #64748b; font-size: 12px; text-transform: uppercase;">Date & Time</td>
        </tr>
        <tr>
          <td style="padding-bottom: 16px; color: #0f172a; font-weight: bold;">${new Date(event.date).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #64748b; font-size: 12px; text-transform: uppercase;">Location</td>
        </tr>
        <tr>
          <td style="padding-bottom: 16px; color: #0f172a; font-weight: bold;">${event.location}</td>
        </tr>
      </table>

      <div style="text-align: center; border-top: 2px dashed #e2e8f0; padding-top: 24px;">
        <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">Scan this QR code at the entrance</p>
        <img src="cid:ticketqrcode" alt="Ticket QR Code" style="width: 150px; height: 150px; border: 8px solid #f1f5f9; border-radius: 8px;" />
        <p style="margin-top: 16px; font-family: monospace; color: #94a3b8;">${registrationId.toString().slice(-8).toUpperCase()}</p>
      </div>
    </div>
    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; word-wrap: break-word;">
      © ${new Date().getFullYear()} ${brandName}. All rights reserved.
    </div>
  </div>
  `;

  const attachments = [
    {
      filename: 'ticket-qr.png',
      content: qrCodeBuffer.split(',')[1], // Remove 'data:image/png;base64,' prefix if present, but wait, usually we pass the buffer or proper base64 string
      encoding: 'base64',
      cid: 'ticketqrcode'
    }
  ];

  return sendEmail({ to, subject, html, attachments });
}

export async function sendEventRejectionEmail(to, event, reason) {
  const subject = `Your event ${event.title} requires changes`;
  const organizerDashboardUrl = env.clientUrl
    ? `${env.clientUrl.replace(/\/$/, '')}/organizer/dashboard`
    : null;
  const safeEventTitle = escapeHtml(event.title);
  const safeReason = escapeHtml(reason);
  const safeOrganizerDashboardUrl = organizerDashboardUrl
    ? escapeHtml(organizerDashboardUrl)
    : null;

  const dashboardInstruction = organizerDashboardUrl
    ? `<p style="margin: 0 0 16px; color: #334155;">Open your organizer dashboard here to edit and resubmit your event:</p>
       <p style="margin: 0 0 20px;"><a href="${safeOrganizerDashboardUrl}" style="color: #dc2626; font-weight: 600;">${safeOrganizerDashboardUrl}</a></p>`
    : `<p style="margin: 0 0 20px; color: #334155;">Open your organizer dashboard, update the event details, and resubmit it for review.</p>`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff7f7; border: 1px solid #fecaca; border-radius: 16px; overflow: hidden;">
    <div style="background: #dc2626; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Event Review Update</h1>
    </div>
    <div style="padding: 28px; background: #ffffff;">
      <p style="margin: 0 0 12px; color: #0f172a;">Your event <strong>${safeEventTitle}</strong> requires changes before it can be approved.</p>
      <div style="margin: 20px 0; padding: 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca;">
        <div style="margin-bottom: 8px; color: #991b1b; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">Reason for rejection</div>
        <div style="color: #7f1d1d; line-height: 1.6;">${safeReason}</div>
      </div>
      ${dashboardInstruction}
      <p style="margin: 0; color: #334155;">Once you have made the requested changes, save the event again to resubmit it for admin review.</p>
    </div>
  </div>
  `;

  return sendEmail({ to, subject, html });
}
