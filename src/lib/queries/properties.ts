import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyPhotos } from "@/lib/db/schema";

export type PropertyPhotoRow = {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
};

export async function getPropertyPhotos(propertyId: string): Promise<PropertyPhotoRow[]> {
  return db
    .select({
      id: propertyPhotos.id,
      url: propertyPhotos.url,
      caption: propertyPhotos.caption,
      sortOrder: propertyPhotos.sortOrder,
    })
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, propertyId))
    .orderBy(asc(propertyPhotos.sortOrder), asc(propertyPhotos.createdAt));
}

export async function getPhotosGroupedByProperty(
  propertyIds: string[]
): Promise<Map<string, PropertyPhotoRow[]>> {
  const map = new Map<string, PropertyPhotoRow[]>();
  if (propertyIds.length === 0) return map;

  const rows = await db
    .select({
      propertyId: propertyPhotos.propertyId,
      id: propertyPhotos.id,
      url: propertyPhotos.url,
      caption: propertyPhotos.caption,
      sortOrder: propertyPhotos.sortOrder,
    })
    .from(propertyPhotos)
    .where(inArray(propertyPhotos.propertyId, propertyIds))
    .orderBy(asc(propertyPhotos.sortOrder));

  for (const row of rows) {
    const list = map.get(row.propertyId) ?? [];
    list.push({
      id: row.id,
      url: row.url,
      caption: row.caption,
      sortOrder: row.sortOrder,
    });
    map.set(row.propertyId, list);
  }

  return map;
}

export async function getPropertiesForAgent() {
  return db
    .select({
      id: properties.id,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      status: properties.status,
      monthlyRent: properties.monthlyRent,
      commissionRate: properties.commissionRate,
    })
    .from(properties)
    .where(eq(properties.status, "available"))
    .orderBy(properties.location, properties.propertyCode);
}

export async function getAvailablePropertyById(id: string) {
  const [property] = await db
    .select({
      id: properties.id,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      estado: properties.estado,
      cp: properties.cp,
      monthlyRent: properties.monthlyRent,
      securityDeposit: properties.securityDeposit,
      description: properties.description,
      amenities: properties.amenities,
      status: properties.status,
    })
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  if (!property || property.status !== "available") return null;

  const photos = await getPropertyPhotos(id);
  return { ...property, photos };
}
