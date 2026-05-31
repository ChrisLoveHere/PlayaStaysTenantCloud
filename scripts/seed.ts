import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  properties,
  prospects,
  users,
} from "@/lib/db/schema";

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const [landlord] = await db
    .insert(users)
    .values({
      name: "Carlos Landlord",
      email: "landlord@example.com",
      passwordHash,
      role: "landlord",
      phone: "+52 55 1234 5678",
    })
    .returning();

  const [agentUser] = await db
    .insert(users)
    .values({
      name: "Ana Agent",
      email: "agent@example.com",
      passwordHash,
      role: "agent",
      phone: "+52 55 8765 4321",
    })
    .returning();

  const [agentProfile] = await db
    .insert(agentProfiles)
    .values({
      userId: agentUser.id,
      commissionType: "percent",
      commissionRate: 10,
      bio: "Experienced leasing agent in CDMX.",
    })
    .returning();

  const [prospectUser] = await db
    .insert(users)
    .values({
      name: "María Prospect",
      email: "prospect@example.com",
      passwordHash,
      role: "prospect",
      phone: "+52 55 1111 2222",
    })
    .returning();

  const [prospect] = await db
    .insert(prospects)
    .values({
      userId: prospectUser.id,
      income: 4500000, // $45,000 MXN/month in cents
      employment: JSON.stringify({
        employer: "Tech Corp MX",
        position: "Software Engineer",
        yearsEmployed: 3,
      }),
    })
    .returning();

  const [property] = await db
    .insert(properties)
    .values({
      propertyCode: "PROP-001",
      calle: "Av. Reforma 123",
      colonia: "Juárez",
      ciudad: "Ciudad de México",
      estado: "CDMX",
      cp: "06600",
      monthlyRent: 1800000, // $18,000 MXN
      securityDeposit: 1800000,
      description: "Modern 2-bedroom apartment with city views.",
      amenities: JSON.stringify(["Elevator", "Parking", "Rooftop terrace"]),
      keycodes: JSON.stringify({ building: "4521", unit: "302" }),
    })
    .returning();

  await db.insert(applications).values({
    prospectId: prospect.id,
    propertyId: property.id,
    assignedAgentId: agentProfile.id,
    stage: "applied",
    submittedAt: new Date(),
  });

  console.log("Seed complete!");
  console.log("\nDemo accounts (password: password123):");
  console.log("  Landlord: landlord@example.com");
  console.log("  Agent:    agent@example.com");
  console.log("  Prospect: prospect@example.com");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
