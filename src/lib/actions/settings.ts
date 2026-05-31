"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { landlordSettings } from "@/lib/db/schema";
import { landlordSettingsSchema } from "@/lib/validations/settings";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function updateLandlordSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireLandlord();

  const parsed = landlordSettingsSchema.safeParse({
    speiClabe: formData.get("speiClabe") || undefined,
    speiBeneficiary: formData.get("speiBeneficiary") || undefined,
    speiBank: formData.get("speiBank") || undefined,
    notifyEmail: formData.get("notifyEmail") || undefined,
    sendApplicationEmails: formData.get("sendApplicationEmails") || undefined,
    sendReceiptEmails: formData.get("sendReceiptEmails") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please check your settings and try again." };
  }

  const data = parsed.data;
  const values = {
    speiClabe: data.speiClabe?.trim() || null,
    speiBeneficiary: data.speiBeneficiary?.trim() || null,
    speiBank: data.speiBank?.trim() || null,
    notifyEmail: data.notifyEmail?.trim() || null,
    sendApplicationEmails: data.sendApplicationEmails === "on",
    sendReceiptEmails: data.sendReceiptEmails === "on",
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: landlordSettings.id })
    .from(landlordSettings)
    .where(eq(landlordSettings.id, "default"))
    .limit(1);

  if (existing) {
    await db
      .update(landlordSettings)
      .set(values)
      .where(eq(landlordSettings.id, "default"));
  } else {
    await db.insert(landlordSettings).values({ id: "default", ...values });
  }

  revalidatePath("/landlord/settings");
  revalidatePath("/portal/payments");
  return { success: "Settings saved." };
}
