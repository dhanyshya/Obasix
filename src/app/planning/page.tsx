import { Suspense } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { pageMax, pagePad } from "@/components/home/directory/sign";
import { PlannerStudio } from "@/components/planners/PlannerStudio";

export const metadata = {
  title: "Planning & Display Boards",
  description: "Weekly and monthly planners, task boards, production dashboards and training boards, printed on a magnetic whiteboard to your layout.",
};

export default function PlanningPage() {
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
        <Suspense
          fallback={
            <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
              <CircularProgress size={22} aria-label="Loading planner designer" />
            </Box>
          }
        >
          <PlannerStudio />
        </Suspense>
      </Box>
    </Box>
  );
}
