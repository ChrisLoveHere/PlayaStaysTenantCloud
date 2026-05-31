import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  properties,
  prospects,
  users,
} from "@/lib/db/schema";

const SAMPLE_PROPERTIES = [
  {
    propertyCode: "PDC-001",
    location: "playa_del_carmen" as const,
    calle: "Calle 28 Norte 123",
    colonia: "Centro",
    ciudad: "Playa del Carmen",
    estado: "Quintana Roo",
    cp: "77710",
    status: "occupied" as const,
    monthlyRent: 2200000,
    securityDeposit: 2200000,
    description: "2BR condo steps from 5th Avenue.",
    amenities: JSON.stringify(["Pool", "AC", "Parking"]),
  },
  {
    propertyCode: "TUL-001",
    location: "tulum" as const,
    calle: "Av. Coba Sur 45",
    colonia: "La Veleta",
    ciudad: "Tulum",
    estado: "Quintana Roo",
    cp: "77760",
    status: "available" as const,
    monthlyRent: 2800000,
    securityDeposit: 2800000,
    description: "Modern studio with rooftop access.",
    amenities: JSON.stringify(["Rooftop", "WiFi", "Kitchen"]),
  },
  {
    propertyCode: "CZM-001",
    location: "cozumel" as const,
    calle: "Calle 5 Sur 89",
    colonia: "Centro",
    ciudad: "Cozumel",
    estado: "Quintana Roo",
    cp: "77600",
    status: "available" as const,
    monthlyRent: 1600000,
    securityDeposit: 1600000,
    description: "Cozy 1BR near the waterfront.",
    amenities: JSON.stringify(["Balcony", "AC"]),
  },
  {
    propertyCode: "PM-001",
    location: "puerto_morelos" as const,
    calle: "Av. Rojo Gómez 12",
    colonia: "Centro",
    ciudad: "Puerto Morelos",
    estado: "Quintana Roo",
    cp: "77580",
    status: "occupied" as const,
    monthlyRent: 1800000,
    securityDeposit: 1800000,
    description: "Beach-area 2BR with garden.",
    amenities: JSON.stringify(["Garden", "Parking", "Pet friendly"]),
  },
  {
    propertyCode: "IM-001",
    location: "isla_mujeres" as const,
    calle: "Av. Hidalgo 56",
    colonia: "Centro",
    ciudad: "Isla Mujeres",
    estado: "Quintana Roo",
    cp: "77400",
    status: "maintenance" as const,
    monthlyRent: 2000000,
    securityDeposit: 2000000,
    description: "Island cottage, short walk to ferry.",
    amenities: JSON.stringify(["Terrace", "AC"]),
  },
];

async function seed() {
  console.log("Seeding PlayaStays database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  async function upsertUser(
    email: string,
    data: { name: string; role: "landlord" | "agent" | "prospect"; phone: string }
  ) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) return existing;
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash, ...data })
      .returning();
    return created;
  }

  const landlord = await upsertUser("landlord@example.com", {
    name: "Chris Landlord",
    role: "landlord",
    phone: "+52 984 123 4567",
  });

  const agentUser = await upsertUser("agent@example.com", {
    name: "Ana Agent",
    role: "agent",
    phone: "+52 984 876 5432",
  });

  let [agentProfile] = await db
    .select()
    .from(agentProfiles)
    .where(eq(agentProfiles.userId, agentUser.id))
    .limit(1);

  if (!agentProfile) {
    [agentProfile] = await db
      .insert(agentProfiles)
      .values({
        userId: agentUser.id,
        commissionType: "percent",
        commissionRate: 10,
        bio: "Leasing agent — Riviera Maya",
        isActive: true,
      })
      .returning();
  }

  const prospectUser = await upsertUser("prospect@example.com", {
    name: "María Prospect",
    role: "prospect",
    phone: "+52 984 111 2222",
  });

  let [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.userId, prospectUser.id))
    .limit(1);

  if (!prospect) {
    [prospect] = await db
      .insert(prospects)
      .values({
        userId: prospectUser.id,
        income: 4500000,
        employment: JSON.stringify({
          employer: "Remote Tech Co",
          position: "Designer",
          yearsEmployed: 2,
        }),
      })
      .returning();
  }

  for (const prop of SAMPLE_PROPERTIES) {
    const [existing] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.propertyCode, prop.propertyCode))
      .limit(1);

    if (!existing) {
      await db.insert(properties).values(prop);
    }
  }

  const [firstProperty] = await db
    .select()
    .from(properties)
    .where(eq(properties.propertyCode, "PDC-001"))
    .limit(1);

  if (firstProperty && prospect && agentProfile) {
    const [existingApp] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.prospectId, prospect.id))
      .limit(1);

    if (!existingApp) {
      await db.insert(applications).values({
        prospectId: prospect.id,
        propertyId: firstProperty.id,
        assignedAgentId: agentProfile.id,
        stage: "applied",
        submittedAt: new Date(),
      });
    }
  }

  console.log("Seed complete!");
  console.log("\nDemo accounts (password: password123):");
  console.log("  Landlord: landlord@example.com");
  console.log("  Agent:    agent@example.com");
  console.log("  Prospect: prospect@example.com");
  console.log(`\nLandlord user: ${landlord.email}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
