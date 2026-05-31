import { relations } from "drizzle-orm";
import {
  accounts,
  agentAvailabilityBlocks,
  agentProfiles,
  applicationStageHistory,
  applications,
  commissions,
  documents,
  leases,
  maintenanceRequests,
  moveChecklists,
  properties,
  propertyPhotos,
  prospects,
  rentPayments,
  sessions,
  showings,
  tenants,
  users,
} from "./tables";

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  agentProfile: one(agentProfiles, {
    fields: [users.id],
    references: [agentProfiles.userId],
  }),
  prospect: one(prospects, {
    fields: [users.id],
    references: [prospects.userId],
  }),
  tenant: one(tenants, {
    fields: [users.id],
    references: [tenants.userId],
  }),
}));

export const agentProfilesRelations = relations(agentProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [agentProfiles.userId],
    references: [users.id],
  }),
  applications: many(applications),
  showings: many(showings),
  availabilityBlocks: many(agentAvailabilityBlocks),
  tenants: many(tenants),
  commissions: many(commissions),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  photos: many(propertyPhotos),
  applications: many(applications),
  showings: many(showings),
  tenants: many(tenants),
  leases: many(leases),
  maintenanceRequests: many(maintenanceRequests),
  rentPayments: many(rentPayments),
}));

export const propertyPhotosRelations = relations(propertyPhotos, ({ one }) => ({
  property: one(properties, {
    fields: [propertyPhotos.propertyId],
    references: [properties.id],
  }),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  user: one(users, {
    fields: [prospects.userId],
    references: [users.id],
  }),
  applications: many(applications),
  showings: many(showings),
  tenant: one(tenants, {
    fields: [prospects.id],
    references: [tenants.prospectId],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  prospect: one(prospects, {
    fields: [applications.prospectId],
    references: [prospects.id],
  }),
  property: one(properties, {
    fields: [applications.propertyId],
    references: [properties.id],
  }),
  assignedAgent: one(agentProfiles, {
    fields: [applications.assignedAgentId],
    references: [agentProfiles.id],
  }),
  stageHistory: many(applicationStageHistory),
  showings: many(showings),
}));

export const applicationStageHistoryRelations = relations(
  applicationStageHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStageHistory.applicationId],
      references: [applications.id],
    }),
    changedBy: one(users, {
      fields: [applicationStageHistory.changedById],
      references: [users.id],
    }),
  })
);

export const showingsRelations = relations(showings, ({ one }) => ({
  property: one(properties, {
    fields: [showings.propertyId],
    references: [properties.id],
  }),
  prospect: one(prospects, {
    fields: [showings.prospectId],
    references: [prospects.id],
  }),
  agent: one(agentProfiles, {
    fields: [showings.agentId],
    references: [agentProfiles.id],
  }),
  application: one(applications, {
    fields: [showings.applicationId],
    references: [applications.id],
  }),
}));

export const agentAvailabilityBlocksRelations = relations(
  agentAvailabilityBlocks,
  ({ one }) => ({
    agent: one(agentProfiles, {
      fields: [agentAvailabilityBlocks.agentId],
      references: [agentProfiles.id],
    }),
  })
);

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(users, {
    fields: [tenants.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [tenants.propertyId],
    references: [properties.id],
  }),
  assignedAgent: one(agentProfiles, {
    fields: [tenants.assignedAgentId],
    references: [agentProfiles.id],
  }),
  prospect: one(prospects, {
    fields: [tenants.prospectId],
    references: [prospects.id],
  }),
  application: one(applications, {
    fields: [tenants.applicationId],
    references: [applications.id],
  }),
  leases: many(leases),
  maintenanceRequests: many(maintenanceRequests),
  moveChecklists: many(moveChecklists),
  rentPayments: many(rentPayments),
  commissions: many(commissions),
}));

export const moveChecklistsRelations = relations(moveChecklists, ({ one }) => ({
  tenant: one(tenants, {
    fields: [moveChecklists.tenantId],
    references: [tenants.id],
  }),
  completedBy: one(users, {
    fields: [moveChecklists.completedById],
    references: [users.id],
  }),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [leases.tenantId],
    references: [tenants.id],
  }),
  property: one(properties, {
    fields: [leases.propertyId],
    references: [properties.id],
  }),
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  agent: one(agentProfiles, {
    fields: [commissions.agentId],
    references: [agentProfiles.id],
  }),
  lease: one(leases, {
    fields: [commissions.leaseId],
    references: [leases.id],
  }),
  tenant: one(tenants, {
    fields: [commissions.tenantId],
    references: [tenants.id],
  }),
}));

export const maintenanceRequestsRelations = relations(
  maintenanceRequests,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [maintenanceRequests.tenantId],
      references: [tenants.id],
    }),
    property: one(properties, {
      fields: [maintenanceRequests.propertyId],
      references: [properties.id],
    }),
  })
);

export const rentPaymentsRelations = relations(rentPayments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [rentPayments.tenantId],
    references: [tenants.id],
  }),
  property: one(properties, {
    fields: [rentPayments.propertyId],
    references: [properties.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
}));
