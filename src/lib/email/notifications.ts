import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import {
  applicationStageEmail,
  newApplicationLandlordEmail,
  rentReceiptEmail,
} from "@/lib/email/templates";
import { getLandlordSettings, getLandlordNotifyEmail } from "@/lib/queries/settings";
import { applicationStageLabel } from "@/lib/utils/format";
import type { ApplicationStage } from "@/lib/db/schema";

const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export async function notifyProspectStageChange(input: {
  prospectEmail: string;
  prospectName: string;
  propertyCode: string;
  stage: ApplicationStage;
}) {
  const settings = await getLandlordSettings();
  if (!settings.sendApplicationEmails || !isEmailConfigured()) return;

  const mail = applicationStageEmail({
    prospectName: input.prospectName,
    propertyCode: input.propertyCode,
    stageLabel: applicationStageLabel(input.stage),
  });

  await sendEmail({
    to: input.prospectEmail,
    subject: mail.subject,
    html: mail.html,
  });
}

export async function notifyLandlordNewApplication(input: {
  prospectName: string;
  prospectEmail: string;
  propertyCode: string;
  applicationId: string;
}) {
  const settings = await getLandlordSettings();
  if (!settings.sendApplicationEmails || !isEmailConfigured()) return;

  const landlordEmail = await getLandlordNotifyEmail();
  if (!landlordEmail) return;

  const mail = newApplicationLandlordEmail(input);
  await sendEmail({
    to: landlordEmail,
    subject: mail.subject,
    html: mail.html,
  });
}

export async function sendRentReceiptEmail(input: {
  tenantEmail: string;
  tenantName: string;
  propertyCode: string;
  amount: number;
  paidDate: Date;
  reference: string | null;
  paymentMethod: string | null;
  paymentId: string;
}) {
  const settings = await getLandlordSettings();
  if (!settings.sendReceiptEmails || !isEmailConfigured()) return;

  const receiptUrl = `${appUrl}/portal/payments/receipt/${input.paymentId}`;
  const mail = rentReceiptEmail({
    tenantName: input.tenantName,
    propertyCode: input.propertyCode,
    amount: input.amount,
    paidDate: input.paidDate,
    reference: input.reference,
    paymentMethod: input.paymentMethod,
    receiptUrl,
  });

  await sendEmail({
    to: input.tenantEmail,
    subject: mail.subject,
    html: mail.html,
  });
}
