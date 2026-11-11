import Box from "@mui/material/Box";
import { pageMax, pagePad } from "@/components/home/directory/sign";
import { brandTokens as brand } from "@/theme/brandTokens";

/** Route loading state: a running stripe and a skeleton of the masthead. */
export default function Loading() {
  return (
    <Box role="status" aria-live="polite" sx={{ bgcolor: brand.ivory, minHeight: "60vh" }}>
      <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", whiteSpace: "nowrap", clip: "rect(0 0 0 0)" }}>
        Loading
      </Box>
      <Box sx={{ position: "relative", height: 4, overflow: "hidden", bgcolor: brand.line }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: "30%",
            bgcolor: brand.forest,
            "@media (prefers-reduced-motion: no-preference)": { animation: "obxRun 1.1s cubic-bezier(0.65,0,0.35,1) infinite" },
            "@keyframes obxRun": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(340%)" } },
          }}
        />
      </Box>
      <Box sx={{ bgcolor: brand.white, py: { xs: 5, md: 8 } }}>
        <Box sx={{ ...pageMax, ...pagePad }}>
          <Box sx={{ width: 120, height: 14, bgcolor: "#E5E5E0" }} />
          <Box sx={{ mt: 2.5, width: "min(560px, 80%)", height: { xs: 40, md: 56 }, bgcolor: "#E5E5E0" }} />
          <Box sx={{ mt: 2, width: "min(420px, 60%)", height: 16, bgcolor: brand.ivory }} />
        </Box>
      </Box>
    </Box>
  );
}
