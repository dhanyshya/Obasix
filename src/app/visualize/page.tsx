import { Suspense } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { VisualizeStart } from "@/components/visualize/VisualizeStart";

export const metadata = {
  title: "Visualize Your Space",
  description:
    "Choose an OBASIX board, upload a photo of your wall, and preview how it looks before you buy.",
};

export default function VisualizeIndexPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <VisualizeStart />
    </Suspense>
  );
}
