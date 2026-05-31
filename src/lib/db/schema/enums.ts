/** Shared enum values — stored as text in DB for SQLite + Postgres compatibility */

export const USER_ROLES = [
  "landlord",
  "agent",
  "tenant",
  "prospect",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROPERTY_STATUSES = [
  "available",
  "occupied",
  "maintenance",
  "off_market",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const APPLICATION_STAGES = [
  "new",
  "property_viewed",
  "applied",
  "screening",
  "approved",
  "lease_sent",
  "lease_signed",
  "moved_in",
  "rejected",
] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const SHOWING_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type ShowingStatus = (typeof SHOWING_STATUSES)[number];

export const LEASE_STATUSES = [
  "draft",
  "sent",
  "signed",
  "expired",
  "terminated",
] as const;
export type LeaseStatus = (typeof LEASE_STATUSES)[number];

export const TENANT_STATUSES = ["active", "past"] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const MAINTENANCE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const RENT_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "overdue",
  "partial",
] as const;
export type RentPaymentStatus = (typeof RENT_PAYMENT_STATUSES)[number];

export const COMMISSION_TYPES = ["percent", "flat"] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

export const COMMISSION_STATUSES = ["pending", "paid"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "overdue_rent",
  "overdue_rent_followup",
  "lease_renewal_60",
  "lease_renewal_30",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PLAYA_LOCATIONS = [
  "playa_del_carmen",
  "puerto_morelos",
  "tulum",
  "cozumel",
  "isla_mujeres",
  "xpu_ha",
  "other",
] as const;
export type PlayaLocation = (typeof PLAYA_LOCATIONS)[number];
