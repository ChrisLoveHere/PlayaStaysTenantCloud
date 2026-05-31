"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { agentProfiles, properties, tenants, users } from "@/lib/db/schema";
import {
  createTenantSchema,
  updateTenantSchema,
} from "@/lib/validations/tenant";

export type TenantActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createTenantByLandlord(
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  await requireLandlord();

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    propertyId: formData.get("propertyId"),
    assignedAgentId: formData.get("assignedAgentId") || undefined,
    moveInDate: formData.get("moveInDate") || undefined,
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.id, data.propertyId))
    .limit(1);

  if (!property) return { error: "Property not found." };

  const passwordHash = await bcrypt.hash(data.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name.trim(),
      email,
      phone: data.phone?.trim() || null,
      passwordHash,
      role: "tenant",
    })
    .returning({ id: users.id });

  if (!user) return { error: "Failed to create tenant user." };

  const moveInDate = data.moveInDate ? new Date(data.moveInDate) : null;

  const [tenant] = await db
    .insert(tenants)
    .values({
      userId: user.id,
      propertyId: data.propertyId,
      assignedAgentId: data.assignedAgentId || null,
      moveInDate,
      status: data.status,
    })
    .returning({ id: tenants.id });

  if (data.status === "active") {
    await db
      .update(properties)
      .set({ status: "occupied", updatedAt: new Date() })
      .where(eq(properties.id, data.propertyId));
  }

  revalidatePath("/landlord/tenants");
  revalidatePath("/landlord");
  redirect(`/landlord/tenants/${tenant?.id}`);
}

export async function updateTenantByLandlord(
  tenantId: string,
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  await requireLandlord();

  const parsed = updateTenantSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    propertyId: formData.get("propertyId"),
    assignedAgentId: formData.get("assignedAgentId") || undefined,
    status: formData.get("status"),
    moveInDate: formData.get("moveInDate") || undefined,
    moveOutDate: formData.get("moveOutDate") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const [tenant] = await db
    .select({
      userId: tenants.userId,
      propertyId: tenants.propertyId,
      status: tenants.status,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return { error: "Tenant not found." };

  await db
    .update(users)
    .set({
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, tenant.userId));

  const moveInDate = data.moveInDate ? new Date(data.moveInDate) : null;
  const moveOutDate = data.moveOutDate ? new Date(data.moveOutDate) : null;

  await db
    .update(tenants)
    .set({
      propertyId: data.propertyId,
      assignedAgentId: data.assignedAgentId || null,
      status: data.status,
      moveInDate,
      moveOutDate,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  if (tenant.propertyId !== data.propertyId) {
    await db
      .update(properties)
      .set({ status: "available", updatedAt: new Date() })
      .where(eq(properties.id, tenant.propertyId));
  }

  if (data.status === "active") {
    await db
      .update(properties)
      .set({ status: "occupied", updatedAt: new Date() })
      .where(eq(properties.id, data.propertyId));
  } else if (data.status === "past") {
    await db
      .update(properties)
      .set({ status: "available", updatedAt: new Date() })
      .where(eq(properties.id, data.propertyId));
  }

  revalidatePath("/landlord/tenants");
  revalidatePath(`/landlord/tenants/${tenantId}`);
  revalidatePath("/portal");
  return { success: "Tenant updated." };
}

export async function getPropertiesForTenantForm() {
  await requireLandlord();
  return db
    .select({
      id: properties.id,
      propertyCode: properties.propertyCode,
      location: properties.location,
      status: properties.status,
    })
    .from(properties)
    .orderBy(properties.propertyCode);
}

export async function getActiveAgentsForSelect() {
  await requireLandlord();
  return db
    .select({
      id: agentProfiles.id,
      name: users.name,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(agentProfiles.isActive, true))
    .orderBy(users.name);
}
