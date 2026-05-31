import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  ApplicationStage,
  CommissionStatus,
  CommissionType,
  LeaseStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MoveChecklistType,
  NotificationType,
  PropertyStatus,
  PlayaLocation,
  RentClaimStatus,
  RentPaymentStatus,
  ShowingStatus,
  TenantStatus,
  UserRole,
} from "./enums";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

// ─── Auth.js tables ───────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").$type<UserRole>().notNull().default("prospect"),
  phone: text("phone"),
  ...timestamps,
});

export const accounts = pgTable(
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

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ─── Leasing agents ───────────────────────────────────────────────────────────

export const agentProfiles = pgTable("agent_profiles", {
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
  commissionRate: integer("commission_rate").notNull().default(10),
  bio: text("bio"),
  /** false until landlord approves self-registered agents */
  isActive: boolean("is_active").notNull().default(false),
  ...timestamps,
});

// ─── Properties ─────────────────────────────────────────────────────────────

export const properties = pgTable("properties", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  propertyCode: text("property_code").notNull().unique(),
  /** PlayaStays portfolio location for filtering & reporting */
  location: text("location").$type<PlayaLocation>().notNull().default("playa_del_carmen"),
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
  monthlyRent: integer("monthly_rent").notNull(),
  securityDeposit: integer("security_deposit").notNull(),
  description: text("description"),
  keycodes: text("keycodes"),
  amenities: text("amenities"),
  /** Agent commission override for this listing (percent, e.g. 10 = 10%) */
  commissionRate: integer("commission_rate"),
  ...timestamps,
});

export const propertyPhotos = pgTable("property_photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Prospects & applications ─────────────────────────────────────────────────

export const prospects = pgTable("prospects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  currentAddress: text("current_address"),
  occupants: integer("occupants"),
  pets: text("pets"),
  income: integer("income"),
  employment: text("employment"),
  previousRentals: text("previous_rentals"),
  references: text("references_data"),
  notes: text("notes"),
  ...timestamps,
});

export const applications = pgTable("applications", {
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
  rating: integer("rating"),
  landlordNotes: text("landlord_notes"),
  submittedAt: timestamp("submitted_at"),
  ...timestamps,
});

export const applicationStageHistory = pgTable("application_stage_history", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const prospectNotes = pgTable("prospect_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  prospectId: text("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  applicationId: text("application_id").references(() => applications.id, {
    onDelete: "cascade",
  }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Showings ─────────────────────────────────────────────────────────────────

export const showings = pgTable("showings", {
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
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  status: text("status")
    .$type<ShowingStatus>()
    .notNull()
    .default("scheduled"),
  outcomeNotes: text("outcome_notes"),
  ...timestamps,
});

export const agentAvailabilityBlocks = pgTable("agent_availability_blocks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id")
    .notNull()
    .references(() => agentProfiles.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  reason: text("reason"),
  allDay: boolean("all_day").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Tenants & leases ─────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
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
  prospectId: text("prospect_id").references(() => prospects.id),
  applicationId: text("application_id").references(() => applications.id),
  moveInDate: timestamp("move_in_date"),
  moveOutDate: timestamp("move_out_date"),
  status: text("status").$type<TenantStatus>().notNull().default("active"),
  ...timestamps,
});

export const leases = pgTable("leases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  monthlyRent: integer("monthly_rent").notNull(),
  securityDeposit: integer("security_deposit").notNull(),
  documentUrl: text("document_url"),
  signedAt: timestamp("signed_at"),
  status: text("status").$type<LeaseStatus>().notNull().default("draft"),
  renewalAlertSent: boolean("renewal_alert_sent").notNull().default(false),
  ...timestamps,
});

export const commissions = pgTable("commissions", {
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
  amount: integer("amount").notNull(),
  rate: integer("rate"),
  type: text("type").$type<CommissionType>().notNull(),
  status: text("status")
    .$type<CommissionStatus>()
    .notNull()
    .default("pending"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Maintenance & rent ───────────────────────────────────────────────────────

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }),
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
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const rentPayments = pgTable("rent_payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  amount: integer("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: text("status")
    .$type<RentPaymentStatus>()
    .notNull()
    .default("pending"),
  paymentMethod: text("payment_method"),
  reference: text("reference"),
  notes: text("notes"),
  ...timestamps,
});

export const rentPaymentClaims = pgTable("rent_payment_claims", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  rentPaymentId: text("rent_payment_id")
    .notNull()
    .references(() => rentPayments.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  reference: text("reference").notNull(),
  amount: integer("amount").notNull(),
  paidDate: timestamp("paid_date").notNull(),
  status: text("status")
    .$type<RentClaimStatus>()
    .notNull()
    .default("pending_review"),
  tenantNotes: text("tenant_notes"),
  landlordNotes: text("landlord_notes"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: text("reviewed_by_id").references(() => users.id),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  ...timestamps,
});

export const moveChecklists = pgTable("move_checklists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  type: text("type").$type<MoveChecklistType>().notNull(),
  depositHeld: integer("deposit_held"),
  depositReturned: integer("deposit_returned"),
  deductionNotes: text("deduction_notes"),
  conditionNotes: text("condition_notes"),
  completedAt: timestamp("completed_at"),
  completedById: text("completed_by_id").references(() => users.id),
  ...timestamps,
});

// ─── Documents (polymorphic) ──────────────────────────────────────────────────

export const documents = pgTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  uploadedById: text("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationLog = pgTable("notification_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").$type<NotificationType>().notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const notificationReads = pgTable(
  "notification_reads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationKey: text("notification_key").notNull(),
    readAt: timestamp("read_at").notNull().defaultNow(),
  },
  (t) => ({
    userNotificationUnique: uniqueIndex("notification_reads_user_key").on(
      t.userId,
      t.notificationKey
    ),
  })
);

export const landlordSettings = pgTable("landlord_settings", {
  id: text("id").primaryKey().default("default"),
  speiClabe: text("spei_clabe"),
  speiBeneficiary: text("spei_beneficiary"),
  speiBank: text("spei_bank"),
  notifyEmail: text("notify_email"),
  sendApplicationEmails: boolean("send_application_emails")
    .notNull()
    .default(true),
  sendReceiptEmails: boolean("send_receipt_emails").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
