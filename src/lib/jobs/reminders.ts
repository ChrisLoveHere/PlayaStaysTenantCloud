import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import {
  leaseRenewalEmail,
  overdueRentLandlordEmail,
  overdueRentTenantEmail,
  showingReminderEmail,
} from "@/lib/email/templates";
import {
  getLandlordEmail,
  getLeasesForRenewalReminder,
  getOverduePaymentsForEmail,
  getShowingsFor24hReminder,
  logNotification,
  markOverdueRentPayments,
  wasNotificationSent,
  wasNotificationSentSince,
} from "@/lib/queries/reminders";
import type { NotificationType } from "@/lib/db/schema";

export type ReminderRunResult = {
  emailEnabled: boolean;
  markedOverdue: number;
  overdueEmailsSent: number;
  renewal60Sent: number;
  renewal30Sent: number;
  showingRemindersSent: number;
  errors: string[];
};

const FOLLOWUP_DAYS = 7;

export async function runDailyReminders(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    emailEnabled: isEmailConfigured(),
    markedOverdue: 0,
    overdueEmailsSent: 0,
    renewal60Sent: 0,
    renewal30Sent: 0,
    showingRemindersSent: 0,
    errors: [],
  };

  result.markedOverdue = await markOverdueRentPayments();

  if (!result.emailEnabled) {
    return result;
  }

  const landlordEmail = await getLandlordEmail();

  try {
    result.overdueEmailsSent = await sendOverdueRentReminders(landlordEmail);
  } catch (err) {
    result.errors.push(
      `Overdue rent: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  try {
    result.renewal60Sent = await sendLeaseRenewalReminders(60, landlordEmail);
  } catch (err) {
    result.errors.push(
      `Renewal 60d: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  try {
    result.renewal30Sent = await sendLeaseRenewalReminders(30, landlordEmail);
  } catch (err) {
    result.errors.push(
      `Renewal 30d: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  try {
    result.showingRemindersSent = await sendShowingReminders();
  } catch (err) {
    result.errors.push(
      `Showing 24h: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  return result;
}

async function sendOverdueRentReminders(landlordEmail: string | null) {
  const payments = await getOverduePaymentsForEmail();
  let sent = 0;
  const followupSince = new Date();
  followupSince.setDate(followupSince.getDate() - FOLLOWUP_DAYS);

  for (const payment of payments) {
    const alreadySent = await wasNotificationSent("overdue_rent", payment.id);
    const followupSent = await wasNotificationSentSince(
      "overdue_rent_followup",
      payment.id,
      followupSince
    );

    if (alreadySent && followupSent) continue;

    const type: NotificationType = alreadySent
      ? "overdue_rent_followup"
      : "overdue_rent";

    if (payment.tenantEmail) {
      const tenantMail = overdueRentTenantEmail({
        tenantName: payment.tenantName ?? "Tenant",
        propertyCode: payment.propertyCode,
        amount: payment.amount,
        dueDate: payment.dueDate,
      });
      await sendEmail({
        to: payment.tenantEmail,
        subject: tenantMail.subject,
        html: tenantMail.html,
      });
    }

    if (landlordEmail) {
      const landlordMail = overdueRentLandlordEmail({
        tenantName: payment.tenantName ?? "Tenant",
        propertyCode: payment.propertyCode,
        amount: payment.amount,
        dueDate: payment.dueDate,
      });
      await sendEmail({
        to: landlordEmail,
        subject: landlordMail.subject,
        html: landlordMail.html,
      });
    }

    await logNotification(type, "rent_payment", payment.id);
    sent++;
  }

  return sent;
}

async function sendLeaseRenewalReminders(
  daysUntilEnd: 60 | 30,
  landlordEmail: string | null
) {
  const notificationType: NotificationType =
    daysUntilEnd === 60 ? "lease_renewal_60" : "lease_renewal_30";

  const leases = await getLeasesForRenewalReminder(daysUntilEnd);
  let sent = 0;

  for (const lease of leases) {
    if (await wasNotificationSent(notificationType, lease.id)) continue;

    if (lease.tenantEmail) {
      const tenantMail = leaseRenewalEmail({
        recipientName: lease.tenantName ?? "Tenant",
        tenantName: lease.tenantName ?? "Tenant",
        propertyCode: lease.propertyCode,
        endDate: lease.endDate,
        daysUntilEnd,
        forLandlord: false,
      });
      await sendEmail({
        to: lease.tenantEmail,
        subject: tenantMail.subject,
        html: tenantMail.html,
      });
    }

    if (landlordEmail) {
      const landlordMail = leaseRenewalEmail({
        recipientName: "Landlord",
        tenantName: lease.tenantName ?? "Tenant",
        propertyCode: lease.propertyCode,
        endDate: lease.endDate,
        daysUntilEnd,
        forLandlord: true,
      });
      await sendEmail({
        to: landlordEmail,
        subject: landlordMail.subject,
        html: landlordMail.html,
      });
    }

    await logNotification(notificationType, "lease", lease.id);
    sent++;
  }

  return sent;
}

async function sendShowingReminders() {
  const showings = await getShowingsFor24hReminder();
  let sent = 0;

  for (const showing of showings) {
    if (await wasNotificationSent("showing_reminder_24h", showing.id)) continue;

    if (showing.agentEmail) {
      const agentMail = showingReminderEmail({
        recipientName: showing.agentName ?? "Agent",
        propertyCode: showing.propertyCode,
        scheduledAt: showing.scheduledAt,
        prospectName: showing.prospectName ?? "Prospect",
        agentName: showing.agentName ?? "Agent",
        forAgent: true,
      });
      await sendEmail({
        to: showing.agentEmail,
        subject: agentMail.subject,
        html: agentMail.html,
      });
    }

    if (showing.prospectEmail) {
      const prospectMail = showingReminderEmail({
        recipientName: showing.prospectName ?? "Prospect",
        propertyCode: showing.propertyCode,
        scheduledAt: showing.scheduledAt,
        prospectName: showing.prospectName ?? "Prospect",
        agentName: showing.agentName ?? "Agent",
        forAgent: false,
      });
      await sendEmail({
        to: showing.prospectEmail,
        subject: prospectMail.subject,
        html: prospectMail.html,
      });
    }

    await logNotification("showing_reminder_24h", "showing", showing.id);
    sent++;
  }

  return sent;
}
