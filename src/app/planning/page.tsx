import { connection } from "next/server";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { pageMax, pagePad } from "@/components/home/directory/sign";
import { PlannerStudio } from "@/components/planners/PlannerStudio";

export const metadata = {
  title: "Planning & Display Boards",
  description: "Weekly and monthly planners, task boards, production dashboards and training boards, printed on a magnetic whiteboard to your layout.",
};

export default async function PlanningPage() {
  // Rendered per request so the part that reads the address bar (useSearchParams) is in the
  // server HTML; prerendered, it was a loading placeholder until JavaScript arrived.
  await connection();
  return (
    <Box sx={{ bgcolor: "#F2F3F0", pb: { xs: 10, md: 8 } }}>
      <PageMasthead
        code="Made to order"
        title="Planning and display boards."
        lede="Planners, task boards and production dashboards printed on our magnetic whiteboard. Pick a template, name the columns and rows, and see the board drawn to scale."
        crumbs={[{ href: "/", label: "Home" }, { label: "Planning & Display Boards" }]}
        compact
      />
      <Box sx={{ ...pageMax, ...pagePad, pt: { xs: 4, md: 6 } }}>
        <HydratingSuspense
          fallback={
            <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
              <CircularProgress size={22} aria-label="Loading planner designer" />
            </Box>
          }
        >
          <PlannerStudio />
        </HydratingSuspense>
      </Box>
    </Box>
  );
}
