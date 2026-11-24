import { connection } from "next/server";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { VisualizeStart } from "@/components/visualize/VisualizeStart";

export const metadata = {
  title: "Visualize Your Space",
  description:
    "Choose an OBASIX board, upload a photo of your wall, and preview how it looks before you buy.",
};

export default async function VisualizeIndexPage() {
  // Rendered per request so the part that reads the address bar (useSearchParams) is in the
  // server HTML; prerendered, it was a loading placeholder until JavaScript arrived.
  await connection();
  return (
    <HydratingSuspense
      fallback={
        <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <VisualizeStart />
    </HydratingSuspense>
  );
}
