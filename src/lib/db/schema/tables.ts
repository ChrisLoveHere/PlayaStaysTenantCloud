import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type {
  ApplicationStage,
  CommissionStatus,
  CommissionType,
  LeaseStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PropertyStatus,
  RentPaymentStatus,
  ShowingStatus,
  TenantStatus,
  UserRole,
} from "./enums";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
};

// ─── Auth.js tables ───────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").$type<UserRole>().notNull().default("prospect"),
  phone: text("phone"),
  ...timestamps,
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ─── Leasing agents ───────────────────────────────────────────────────────────

export const agentProfiles = sqliteTable("agent_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  commissionType: text("commission_type")
    .$type<CommissionType>()
    .notNull()
    .default("percent"),
  commissionRate: integer("commission_rate").notNull().default(10), // percent or cents MXN
  bio: text("bio"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

// ─── Properties ─────────────────────────────────────────────────────────────

export const properties = sqliteTable("properties", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  propertyCode: text("property_code").notNull().unique(),
  calle: text("calle").notNull(),
  colonia: text("colonia").notNull(),
  ciudad: text("ciudad").notNull(),
  estado: text("estado").notNull(),
  cp: text("cp").notNull(),
  pais: text("pais").notNull().default("México"),
  status: text("status")
    .$type<PropertyStatus>()
    .notNull()
    .default("available"),
  monthlyRent: integer("monthly_rent").notNull(), // MXN cents
  securityDeposit: integer("security_deposit").notNull(), // MXN cents
  description: text("description"),
  keycodes: text("keycodes"), // JSON string
  amenities: text("amenities"), // JSON string array
  ...timestamps,
});

export const propertyPhotos = sqliteTable("property_photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Prospects & applications ─────────────────────────────────────────────────

export const prospects = sqliteTable("prospects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // Application data (filled during screening)
  income: integer("income"), // MXN cents monthly
  employment: text("employment"), // JSON
  previousRentals: text("previous_rentals"), // JSON
  references: text("references_data"), // JSON
  notes: text("notes"),
  ...timestamps,
});

export const applications = sqliteTable("applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  prospectId: text("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  assignedAgentId: text("assigned_agent_id").references(() => agentProfiles.id),
  stage: text("stage")
    .$type<ApplicationStage>()
    .notNull()
    .default("new"),
  rating: integer("rating"), // 1-5
  landlordNotes: text("landlord_notes"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  ...timestamps,
});

export const applicationStageHistory = sqliteTable("application_stage_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  fromStage: text("from_stage").$type<ApplicationStage>(),
  toStage: text("to_stage").$type<ApplicationStage>().notNull(),
  changedById: text("changed_by_id").references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Showings ─────────────────────────────────────────────────────────────────

export const showings = sqliteTable("showings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  prospectId: text("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => agentProfiles.id),
  applicationId: text("application_id").references(() => applications.id),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  status: text("status")
    .$type<ShowingStatus>()
    .notNull()
    .default("scheduled"),
  outcomeNotes: text("outcome_notes"),
  ...timestamps,
});

export const agentAvailabilityBlocks = sqliteTable("agent_availability_blocks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id")
    .notNull()
    .references(() => agentProfiles.id, { onDelete: "cascade" }),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
  reason: text("reason"),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Tenants & leases ─────────────────────────────────────────────────────────

export const tenants = sqliteTable("tenants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  assignedAgentId: text("assigned_agent_id").references(() => agentProfiles.id),
  prospectId: text("prospect_id").references(() => prospects.id), // history link
  applicationId: text("application_id").references(() => applications.id),
  moveInDate: integer("move_in_date", { mode: "timestamp" }),
  moveOutDate: integer("move_out_date", { mode: "timestamp" }),
  status: text("status").$type<TenantStatus>().notNull().default("active"),
  ...timestamps,
});

export const leases = sqliteTable("leases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  monthlyRent: integer("monthly_rent").notNull(),
  securityDeposit: integer("security_deposit").notNull(),
  documentUrl: text("document_url"),
  signedAt: integer("signed_at", { mode: "timestamp" }),
  status: text("status").$type<LeaseStatus>().notNull().default("draft"),
  renewalAlertSent: integer("renewal_alert_sent", { mode: "boolean" })
    .notNull()
    .default(false),
  ...timestamps,
});

export const commissions = sqliteTable("commissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id")
    .notNull()
    .references(() => agentProfiles.id),
  leaseId: text("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id),
  amount: integer("amount").notNull(), // MXN cents
  rate: integer("rate"), // percent or flat amount used
  type: text("type").$type<CommissionType>().notNull(),
  status: text("status")
    .$type<CommissionStatus>()
    .notNull()
    .default("pending"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Maintenance & rent ───────────────────────────────────────────────────────

export const maintenanceRequests = sqliteTable("maintenance_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority")
    .$type<MaintenancePriority>()
    .notNull()
    .default("medium"),
  status: text("status")
    .$type<MaintenanceStatus>()
    .notNull()
    .default("open"),
  submittedAt: integer("submitted_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});

export const rentPayments = sqliteTable("rent_payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  amount: integer("amount").notNull(), // MXN cents
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  paidDate: integer("paid_date", { mode: "timestamp" }),
  status: text("status")
    .$type<RentPaymentStatus>()
    .notNull()
    .default("pending"),
  paymentMethod: text("payment_method"), // e.g. SPEI
  reference: text("reference"), // SPEI reference / CLABE note
  notes: text("notes"),
  ...timestamps,
});

// ─── Documents (polymorphic) ──────────────────────────────────────────────────

export const documents = sqliteTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(), // property | application | tenant | lease | maintenance
  entityId: text("entity_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  uploadedById: text("uploaded_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
