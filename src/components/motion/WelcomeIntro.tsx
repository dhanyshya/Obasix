"use client";

import { useLayoutEffect, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { brandTokens } from "@/theme/brandTokens";

const SESSION_KEY = "obasix-welcome-intro-seen";
/** Hold before fade-out begins */
const INTRO_HOLD_MS = 2600;
const INTRO_EXIT_MS = 550;

type Phase = "checking" | "playing" | "exiting" | "done";

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage blocked — continue without remembering */
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Full-screen branded welcome on first homepage visit in a tab session.
 * Deep links and later internal navigation skip the intro.
 *
 * Initial render is always null (SSR + hydrate match). Decision runs in
 * useLayoutEffect so the intro can appear before the browser paints.
 */
export function WelcomeIntro() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("checking");

  useLayoutEffect(() => {
    try {
      if (pathname !== "/") {
        markIntroSeen();
        setPhase("done");
        return;
      }

      if (readSeen() || prefersReducedMotion()) {
        markIntroSeen();
        setPhase("done");
        return;
      }

      setPhase("playing");
    } catch {
      markIntroSeen();
      setPhase("done");
    }
  }, [pathname]);

  useEffect(() => {
    if (phase !== "playing") return;

    let exitTimer: number | undefined;
    const holdTimer = window.setTimeout(() => {
      setPhase("exiting");
      exitTimer = window.setTimeout(() => {
        markIntroSeen();
        setPhase("done");
      }, INTRO_EXIT_MS);
    }, INTRO_HOLD_MS);

    return () => {
      window.clearTimeout(holdTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "exiting") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  if (phase === "checking" || phase === "done") return null;

  return (
    <Box
      component="div"
      role="presentation"
      aria-hidden={phase === "exiting"}
      className={phase === "exiting" ? "welcome-intro is-exiting" : "welcome-intro"}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        display: "grid",
        placeItems: "center",
        px: 3,
        bgcolor: brandTokens.white,
        pointerEvents: phase === "exiting" ? "none" : "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 520,
        }}
      >
        <Box
          className="welcome-intro-brand"
          sx={{
            position: "relative",
            width: { xs: 200, sm: 260, md: 300 },
            height: { xs: 56, sm: 72, md: 84 },
          }}
        >
          <Image
            src="/obasix-logo.png"
            alt="OBASIX"
            fill
            priority
            sizes="300px"
            className="object-contain"
          />
        </Box>

        <Typography
          className="welcome-intro-name"
          component="p"
          sx={{
            mt: { xs: 2.5, md: 3 },
            mb: 0,
            fontFamily: 'var(--font-display), var(--font-body), sans-serif',
            fontWeight: 700,
            letterSpacing: { xs: "0.14em", md: "0.18em" },
            fontSize: { xs: "1.65rem", sm: "2.15rem", md: "2.55rem" },
            lineHeight: 1.05,
            color: brandTokens.forest,
            textTransform: "uppercase",
          }}
        >
          OBASIX
        </Typography>

        <Box
          className="welcome-intro-line"
          aria-hidden
          sx={{
            mt: { xs: 2, md: 2.5 },
            height: 2,
            width: 56,
            borderRadius: 1,
            bgcolor: brandTokens.forest,
            transformOrigin: "center",
          }}
        />

        <Typography
          className="welcome-intro-welcome"
          component="p"
          sx={{
            mt: { xs: 2.25, md: 2.75 },
            mb: 0,
            fontFamily: 'var(--font-display), var(--font-body), sans-serif',
            fontWeight: 600,
            fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.55rem" },
            letterSpacing: "-0.02em",
            color: brandTokens.charcoal,
          }}
        >
          Welcome to OBASIX
        </Typography>

        <Typography
          className="welcome-intro-tagline"
          component="p"
          sx={{
            mt: 1,
            mb: 0,
            fontSize: { xs: 14, md: 15 },
            letterSpacing: "0.04em",
            color: brandTokens.muted,
          }}
        >
          Boards for Better Ideas.
        </Typography>
      </Box>
    </Box>
  );
}
