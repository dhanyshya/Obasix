/**
 * Associate programme terms shared by the client and server.
 * The 5% rate is the Reimagination Program's proposed starting rate and is not
 * yet a verified OBASIX margin: change it here once costing is signed off.
 */

export const associateCommissionRate = 0.05;

/** How long a referral link keeps crediting the associate. */
export const referralWindowDays = 30;

export const referralCookieName = "obasix_ref";

export const associateProfessions = [
  "Architect or interior designer",
  "Real estate broker or property consultant",
  "Office fit-out contractor",
  "Facility manager",
  "Signage installer or local service provider",
  "Freelance sales professional",
] as const;

export type AssociateProfession = (typeof associateProfessions)[number];

export function isAssociateProfession(value: unknown): value is AssociateProfession {
  return associateProfessions.includes(value as AssociateProfession);
}
