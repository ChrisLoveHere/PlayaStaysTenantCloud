import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { landlordSettings } from "@/lib/db/schema";

export type LandlordSettings = {
  speiClabe: string | null;
  speiBeneficiary: string | null;
  speiBank: string | null;
  notifyEmail: string | null;
  sendApplicationEmails: boolean;
  sendReceiptEmails: boolean;
};

const DEFAULTS: LandlordSettings = {
  speiClabe: process.env.SPEI_CLABE ?? null,
  speiBeneficiary: process.env.SPEI_BENEFICIARY ?? null,
  speiBank: process.env.SPEI_BANK ?? null,
  notifyEmail: process.env.LANDLORD_NOTIFY_EMAIL ?? null,
  sendApplicationEmails: true,
  sendReceiptEmails: true,
};

export async function getLandlordSettings(): Promise<LandlordSettings> {
  const [row] = await db
    .select()
    .from(landlordSettings)
    .where(eq(landlordSettings.id, "default"))
    .limit(1);

  if (!row) return DEFAULTS;

  return {
    speiClabe: row.speiClabe ?? DEFAULTS.speiClabe,
    speiBeneficiary: row.speiBeneficiary ?? DEFAULTS.speiBeneficiary,
    speiBank: row.speiBank ?? DEFAULTS.speiBank,
    notifyEmail: row.notifyEmail ?? DEFAULTS.notifyEmail,
    sendApplicationEmails: row.sendApplicationEmails,
    sendReceiptEmails: row.sendReceiptEmails,
  };
}

export async function getSpeiDetails() {
  const s = await getLandlordSettings();
  return {
    clabe: s.speiClabe,
    beneficiary: s.speiBeneficiary,
    bank: s.speiBank,
  };
}

export async function getLandlordNotifyEmail(): Promise<string | null> {
  const settings = await getLandlordSettings();
  if (settings.notifyEmail) return settings.notifyEmail;

  const { users } = await import("@/lib/db/schema");
  const [landlord] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "landlord"))
    .limit(1);

  return landlord?.email ?? null;
}
