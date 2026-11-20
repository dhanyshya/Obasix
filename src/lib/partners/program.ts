/**
 * Institutional and project partner channel (plan section 3, fourth channel):
 * partners bring bulk orders and manage the customer's project. Each project
 * earns a margin negotiated for that project, set by staff when it's quoted.
 */

export const partnerTypes = [
  "Fit-out or interior contractor",
  "Facility management company",
  "Real estate developer",
  "Institutional procurement consultant",
  "Signage installer",
  "HSN Group company",
  "Other",
] as const;
export type PartnerType = (typeof partnerTypes)[number];

export const projectSectors = [
  "School or college",
  "Hospital or clinic",
  "Hotel",
  "Co-working or office",
  "Residential project",
  "Retail chain",
  "Government or PSU",
  "Other",
] as const;
export type ProjectSector = (typeof projectSectors)[number];

/** A registered project is reserved for the partner who registered it for this long. */
export const projectProtectionDays = 90;
/** Projects are bulk orders: smaller jobs go through the website or an associate. */
export const minimumProjectValue = 100000;
/** Upper bound staff can set for a negotiated margin. */
export const maxMarginRate = 0.3;

export const projectStatuses = ["Submitted", "Quoted", "Won", "In production", "Delivered", "Paid", "Lost"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

/** Staff move a project one step at a time; Lost is allowed from any open stage. */
export const nextProjectStatus: Partial<Record<ProjectStatus, ProjectStatus>> = {
  Quoted: "Won",
  Won: "In production",
  "In production": "Delivered",
};

/** "ABC Public School", "abc public school " and "ABC Public School." in the same city are one client. */
export function clientKey(clientName: string, city: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${norm(clientName)}|${norm(city)}`;
}
