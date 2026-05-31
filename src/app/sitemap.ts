import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (
    process.env.AUTH_URL ?? "https://playa-stays-tenant-cloud.vercel.app"
  ).replace(/\/$/, "");

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
