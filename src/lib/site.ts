/** Canonical site origin. Set NEXT_PUBLIC_SITE_URL in production (for example https://www.obasix.com). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
