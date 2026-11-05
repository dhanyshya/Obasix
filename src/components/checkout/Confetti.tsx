"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";

const CONFETTI_COLORS = ["#164E3B", "#1F5F47", "#0E3A2C", "#C9A477", "#E5C87E", "#FFFFFF"];

const fall = keyframes`
  0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
  6% { opacity: 1; }
  100% { transform: translate3d(var(--drift), 112vh, 0) rotate(var(--spin)); opacity: 0.85; }
`;

const burst = keyframes`
  0% { transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(0.4); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(calc(-50% + var(--bx)), calc(-50% + var(--by)), 0) rotate(var(--spin)) scale(1); opacity: 0; }
`;

type Piece = {
  id: number;
  left: number;
  size: number;
  width: number;
  delay: number;
  duration: number;
  drift: string;
  spin: string;
  color: string;
  round: boolean;
};

type BurstPiece = {
  id: number;
  bx: string;
  by: string;
  spin: string;
  size: number;
  delay: number;
  duration: number;
  color: string;
  round: boolean;
};

function createRandom(seedValue: number) {
  let seed = seedValue;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function pickColor(index: number) {
  return CONFETTI_COLORS[index % CONFETTI_COLORS.length];
}

export function Confetti({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setTimeout(() => setVisible(false), 4600);
    return () => window.clearTimeout(timer);
  }, [active]);

  const rain = useMemo<Piece[]>(() => {
    const random = createRandom(20261105);
    const between = (min: number, max: number) => min + random() * (max - min);
    return Array.from({ length: 54 }, (_, index) => {
      const round = index % 4 === 3;
      const size = between(7, 12);
      return {
        id: index,
        left: between(0, 100),
        size,
        width: round ? size : size * between(0.45, 0.7),
        delay: between(0, 1.6),
        duration: between(2.6, 4),
        drift: `${between(-14, 14).toFixed(2)}vw`,
        spin: `${between(320, 900).toFixed(0)}deg`,
        color: pickColor(index * 7 + 3),
        round,
      };
    });
  }, []);

  const burstPieces = useMemo<BurstPiece[]>(() => {
    const random = createRandom(987654321);
    const between = (min: number, max: number) => min + random() * (max - min);
    return Array.from({ length: 30 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 30 + between(-0.18, 0.18);
      const distance = between(90, 220);
      return {
        id: index,
        bx: `${(Math.cos(angle) * distance).toFixed(1)}px`,
        by: `${(Math.sin(angle) * distance * 0.85 - 40).toFixed(1)}px`,
        spin: `${between(180, 720).toFixed(0)}deg`,
        size: between(6, 11),
        delay: between(0, 0.15),
        duration: between(1.05, 1.55),
        color: pickColor(index * 5 + 1),
        round: index % 5 === 4,
      };
    });
  }, []);

  if (!visible) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {rain.map((piece) => (
        <Box
          key={`rain-${piece.id}`}
          sx={{
            position: "absolute",
            top: 0,
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.round ? piece.width : piece.size,
            borderRadius: piece.round ? "50%" : "2px",
            bgcolor: piece.color,
            boxShadow: piece.color === "#FFFFFF" ? "0 0 0 1px rgba(41, 45, 41, 0.12)" : "none",
            opacity: 0,
            "--drift": piece.drift,
            "--spin": piece.spin,
            animation: `${fall} ${piece.duration}s cubic-bezier(0.2, 0.6, 0.35, 1) ${piece.delay}s forwards`,
          }}
        />
      ))}
      {burstPieces.map((piece) => (
        <Box
          key={`burst-${piece.id}`}
          sx={{
            position: "absolute",
            left: "50%",
            top: { xs: 150, md: 190 },
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 1.5,
            borderRadius: piece.round ? "50%" : "2px",
            bgcolor: piece.color,
            boxShadow: piece.color === "#FFFFFF" ? "0 0 0 1px rgba(41, 45, 41, 0.12)" : "none",
            opacity: 0,
            "--bx": piece.bx,
            "--by": piece.by,
            "--spin": piece.spin,
            animation: `${burst} ${piece.duration}s cubic-bezier(0.16, 0.84, 0.3, 1) ${piece.delay}s forwards`,
          }}
        />
      ))}
    </Box>
  );
}
