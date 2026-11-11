/**
 * Verified OBASIX company facts.
 * Source: obasix.com (About, Contact, footer) and obasix.in (About, Contacts, Bulk Buying, Distributor), reviewed Nov 2026.
 * Where the sites disagree, obasix.com is used and the difference is recorded in docs/official-website-audit.md.
 */
export const company = {
  legalName: "OBASIX Industries Pvt. Ltd.",
  parent: "A HSN Group company",
  phone: "+919999044222",
  phoneDisplay: "+91 9999 044 222",
  email: "info@obasix.com",
  locations: [
    // obasix.in lists F-96, 9th Floor, Himalaya House, 23 KG Marg as the registered office.
    { label: "Registered office", address: "1105, 11th Floor, Ansal Bhawan, 16 KG Marg, New Delhi 110001" },
    { label: "Factory", address: "J-199, DSIIDC Industrial Area, Sector 1, Bawana, Delhi 110039" },
    { label: "Wholesale store", address: "4124, First Floor, Nai Sarak, Delhi 110006" },
    { label: "Retail store", address: "B-12, LGF, Shubham Enclave, Paschim Vihar, New Delhi 110063" },
  ],
  certifications: ["ISO 9001:2015", "CE", "QCI", "DPCC", "IEC", "Registered trademark"],
  programmes: [
    {
      title: "Bulk and institutional orders",
      body: "Corporate, retail and institutional buyers can request bulk pricing and custom specifications.",
      cta: "Request a bulk quote",
      href: "/quote",
      external: false,
    },
    {
      title: "Government buyers (GeM)",
      body: "OBASIX is a registered OEM on the Government e-Marketplace.",
      cta: "View OBASIX on GeM",
      href: "https://mkp.gem.gov.in/search?q=obasix",
      external: true,
    },
    {
      title: "Become a distributor",
      body: "Distributors can join in their city, with priority for regional resellers.",
      cta: "Enquire about distribution",
      href: "/quote?config=Distributor%20enquiry",
      external: false,
    },
  ],
} as const;
