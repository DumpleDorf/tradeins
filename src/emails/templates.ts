export function reservationEmailHtml(params: {
  vehicleVin: string;
  vehicleDetails: string;
  partnerCompany: string;
  contactName: string;
  contactEmail: string;
  reservedAt: Date;
  appUrl: string;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #171A20;">
      <div style="border-bottom: 3px solid #E31937; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 20px;">New Vehicle Reservation</h1>
      </div>
      <p>A wholesale partner has reserved a trade-in vehicle for purchase.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr><td style="padding: 8px 0; color: #393C41;">VIN</td><td style="padding: 8px 0;"><strong>${params.vehicleVin}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #393C41;">Vehicle</td><td style="padding: 8px 0;">${params.vehicleDetails}</td></tr>
        <tr><td style="padding: 8px 0; color: #393C41;">Partner</td><td style="padding: 8px 0;">${params.partnerCompany}</td></tr>
        <tr><td style="padding: 8px 0; color: #393C41;">Contact</td><td style="padding: 8px 0;">${params.contactName} (${params.contactEmail})</td></tr>
        <tr><td style="padding: 8px 0; color: #393C41;">Reserved at</td><td style="padding: 8px 0;">${params.reservedAt.toLocaleString("en-AU")}</td></tr>
      </table>
      <p><a href="${params.appUrl}/tesla/reservations" style="display: inline-block; background: #E31937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Review in Portal</a></p>
      <p style="color: #393C41; font-size: 13px; margin-top: 32px;">No sale is final until explicitly approved in the portal.</p>
    </div>
  `;
}

export function approvalEmailHtml(params: {
  partnerName: string;
  vehicleLabel: string;
  vin: string;
  appUrl: string;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #171A20;">
      <div style="border-bottom: 3px solid #E31937; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 20px;">Reservation Approved</h1>
      </div>
      <p>Hi ${params.partnerName},</p>
      <p>Your reservation for <strong>${params.vehicleLabel}</strong> (VIN: ${params.vin}) has been approved by Tesla.</p>
      <p>A Tesla representative will be in contact shortly to finalise the sale.</p>
      <p><a href="${params.appUrl}/reservations" style="display: inline-block; background: #E31937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View My Reservations</a></p>
      <p style="color: #393C41; font-size: 13px; margin-top: 32px;">This email constitutes written confirmation of Tesla's approval of your reservation.</p>
    </div>
  `;
}

export function rejectionEmailHtml(params: {
  partnerName: string;
  vehicleLabel: string;
  vin: string;
  reason?: string;
  appUrl: string;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #171A20;">
      <div style="border-bottom: 3px solid #E31937; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 20px;">Reservation Not Approved</h1>
      </div>
      <p>Hi ${params.partnerName},</p>
      <p>Unfortunately, your reservation for <strong>${params.vehicleLabel}</strong> (VIN: ${params.vin}) was not approved.</p>
      ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ""}
      <p>The vehicle has been returned to available inventory.</p>
      <p><a href="${params.appUrl}/inventory" style="display: inline-block; background: #171A20; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Browse Inventory</a></p>
    </div>
  `;
}

export function passwordResetEmailHtml(params: {
  name: string;
  resetUrl: string;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #171A20;">
      <h1 style="font-size: 20px;">Reset Your Password</h1>
      <p>Hi ${params.name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${params.resetUrl}" style="display: inline-block; background: #E31937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p style="color: #393C41; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

export function newListingEmailHtml(params: {
  vehicleLabel: string;
  listPrice: string;
  vehicleUrl: string;
  appUrl: string;
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #171A20;">
      <h1 style="font-size: 20px;">New Vehicle Available</h1>
      <p>A new trade-in vehicle is now available in the wholesale portal.</p>
      <p><strong>${params.vehicleLabel}</strong> — ${params.listPrice}</p>
      <p><a href="${params.vehicleUrl}" style="display: inline-block; background: #E31937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Vehicle</a></p>
      <p style="color: #393C41; font-size: 13px;">All reservations are subject to final approval by Tesla.</p>
    </div>
  `;
}
