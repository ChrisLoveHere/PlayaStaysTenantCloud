import type { MetadataRoute } from "next";

/** Only the tenant portal landing page should be indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/portal/",
        "/landlord/",
        "/agent/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/pending-approval",
        "/api/",
      ],
    },
  };
}
