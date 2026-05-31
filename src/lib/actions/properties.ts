"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { PlayaLocation } from "@/lib/constants/locations";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { propertyFormSchema } from "@/lib/validations/property";
import { parseMXNToCents } from "@/lib/utils/format";

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

export type PropertyActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseFormData(formData: FormData) {
  return propertyFormSchema.safeParse({
    propertyCode: formData.get("propertyCode"),
    location: formData.get("location"),
    calle: formData.get("calle"),
    colonia: formData.get("colonia"),
    ciudad: formData.get("ciudad"),
    estado: formData.get("estado"),
    cp: formData.get("cp"),
    pais: formData.get("pais") || "México",
    status: formData.get("status"),
    monthlyRent: formData.get("monthlyRent"),
    securityDeposit: formData.get("securityDeposit"),
    description: formData.get("description") || undefined,
    keycodes: formData.get("keycodes") || undefined,
    amenities: formData.get("amenities") || undefined,
    commissionRate: formData.get("commissionRate") || undefined,
  });
}

export async function createProperty(
  _prev: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  await requireLandlord();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const commissionRate = data.commissionRate?.trim()
    ? parseInt(data.commissionRate, 10)
    : null;

  try {
    await db.insert(properties).values({
      propertyCode: data.propertyCode.trim().toUpperCase(),
      location: data.location,
      calle: data.calle.trim(),
      colonia: data.colonia.trim(),
      ciudad: data.ciudad.trim(),
      estado: data.estado.trim(),
      cp: data.cp.trim(),
      pais: data.pais.trim(),
      status: data.status,
      monthlyRent: parseMXNToCents(data.monthlyRent),
      securityDeposit: parseMXNToCents(data.securityDeposit),
      description: data.description?.trim() || null,
      keycodes: data.keycodes?.trim() || null,
      amenities: data.amenities?.trim() || null,
      commissionRate: commissionRate && !Number.isNaN(commissionRate) ? commissionRate : null,
    });
  } catch {
    return { error: "Property ID already exists or save failed." };
  }

  revalidatePath("/landlord");
  revalidatePath("/landlord/properties");
  redirect("/landlord/properties");
}

export async function updateProperty(
  id: string,
  _prev: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  await requireLandlord();
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const commissionRate = data.commissionRate?.trim()
    ? parseInt(data.commissionRate, 10)
    : null;

  try {
    await db
      .update(properties)
      .set({
        propertyCode: data.propertyCode.trim().toUpperCase(),
        location: data.location,
        calle: data.calle.trim(),
        colonia: data.colonia.trim(),
        ciudad: data.ciudad.trim(),
        estado: data.estado.trim(),
        cp: data.cp.trim(),
        pais: data.pais.trim(),
        status: data.status,
        monthlyRent: parseMXNToCents(data.monthlyRent),
        securityDeposit: parseMXNToCents(data.securityDeposit),
        description: data.description?.trim() || null,
        keycodes: data.keycodes?.trim() || null,
        amenities: data.amenities?.trim() || null,
        commissionRate: commissionRate && !Number.isNaN(commissionRate) ? commissionRate : null,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id));
  } catch {
    return { error: "Update failed. Property ID may already exist." };
  }

  revalidatePath("/landlord");
  revalidatePath("/landlord/properties");
  revalidatePath(`/landlord/properties/${id}`);
  redirect("/landlord/properties");
}

export async function deleteProperty(id: string) {
  await requireLandlord();
  await db.delete(properties).where(eq(properties.id, id));
  revalidatePath("/landlord");
  revalidatePath("/landlord/properties");
  redirect("/landlord/properties");
}

export async function getProperties(location?: string) {
  await requireLandlord();

  if (location && location !== "all") {
    return db
      .select()
      .from(properties)
      .where(eq(properties.location, location as PlayaLocation))
      .orderBy(properties.propertyCode);
  }

  return db.select().from(properties).orderBy(properties.location, properties.propertyCode);
}

export async function getPropertyById(id: string) {
  await requireLandlord();
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);
  return property ?? null;
}
