import { connection } from "next/server";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignageStudio } from "@/components/signage/SignageStudio";

export const metadata = {
  title: "Design a Sign",
  description: "Design a nameplate, office sign or building directory with a live, to-scale preview.",
};

export default async function SignageDesignPage() {
  // Rendered per request so the part that reads the address bar (useSearchParams) is in the
  // server HTML; prerendered, it was a loading placeholder until JavaScript arrived.
  await connection();
  return (
    <Box sx={{ bgcolor: "#F2F3F0", pb: { xs: 10, md: 8 } }}>
      <PageMasthead
        code="Studio"
        title="Design your sign"
        lede="Choose the sign, size, material and lettering. The preview is drawn to scale and every choice is checked against what we can manufacture."
        crumbs={[{ href: "/signage", label: "Nameplates & Signage" }, { label: "Design your sign" }]}
        compact
      />
      <HydratingSuspense
        fallback={
          <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
            <CircularProgress size={22} aria-label="Loading sign studio" />
          </Box>
        }
      >
        <SignageStudio />
      </HydratingSuspense>
    </Box>
  );
}
