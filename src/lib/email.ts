import { Resend } from "resend";
import {
  approvalEmailHtml,
  newListingEmailHtml,
  passwordResetEmailHtml,
  rejectionEmailHtml,
  reservationEmailHtml,
} from "@/emails/templates";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM ?? "noreply@teslatradeins.com.au";
const teslaInbox = process.env.TESLA_TEAM_EMAIL ?? "tradeins@tesla.com";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://teslatradeins.com.au";

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!resend) {
    console.log("[email:dev]", { to, subject });
    return { id: "dev-mode" };
  }

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendReservationNotification(params: {
  vehicleVin: string;
  vehicleDetails: string;
  partnerCompany: string;
  contactName: string;
  contactEmail: string;
  reservedAt: Date;
}) {
  return sendEmail(
    teslaInbox,
    `New vehicle reservation — VIN ${params.vehicleVin}`,
    reservationEmailHtml({ ...params, appUrl })
  );
}

export async function sendApprovalNotification(params: {
  to: string;
  partnerName: string;
  vehicleLabel: string;
  vin: string;
}) {
  return sendEmail(
    params.to,
    `Reservation approved — ${params.vehicleLabel}`,
    approvalEmailHtml({ ...params, appUrl })
  );
}

export async function sendRejectionNotification(params: {
  to: string;
  partnerName: string;
  vehicleLabel: string;
  vin: string;
  reason?: string;
}) {
  return sendEmail(
    params.to,
    `Reservation update — ${params.vehicleLabel}`,
    rejectionEmailHtml({ ...params, appUrl })
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  return sendEmail(
    params.to,
    "Reset your password — Tesla Trade-Ins Portal",
    passwordResetEmailHtml(params)
  );
}

export async function sendNewListingNotification(params: {
  to: string[];
  vehicleLabel: string;
  listPrice: string;
  vehicleUrl: string;
}) {
  if (params.to.length === 0) return;
  return sendEmail(
    params.to,
    `New vehicle available — ${params.vehicleLabel}`,
    newListingEmailHtml({ ...params, appUrl })
  );
}

export async function sendPartnerInviteEmail(params: {
  to: string;
  name: string;
  companyName: string;
  temporaryPassword: string;
}) {
  return sendEmail(
    params.to,
    "You've been invited — Tesla Trade-Ins Wholesale Portal",
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #171A20;">Welcome to the Tesla Trade-Ins Portal</h1>
        <p>Hi ${params.name},</p>
        <p>Your company <strong>${params.companyName}</strong> has been approved as a wholesale partner.</p>
        <p>Sign in at <a href="${appUrl}/login/partner">${appUrl}/login/partner</a></p>
        <p><strong>Email:</strong> ${params.to}<br/><strong>Temporary password:</strong> ${params.temporaryPassword}</p>
        <p>Please change your password after your first login.</p>
      </div>
    `
  );
}
