"use client";

import { useEffect } from "react";

/** Picks up `?ref=CODE` from any page and asks the server to remember it. */
export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code || !/^[A-Za-z0-9]{6,12}$/.test(code)) return;
    fetch("/api/associates/ref", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      /* Attribution is best effort; the page works without it. */
    });
  }, []);
  return null;
}
