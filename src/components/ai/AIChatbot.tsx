"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import MinimizeIcon from "@mui/icons-material/Remove";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import Link from "@/components/Link";
import { useAIChat } from "@/context/AIChatContext";
import { buildCustomizeHref } from "@/lib/format";
import { brandTokens } from "@/theme/brandTokens";
import { AIProductCard } from "./AIProductCard";

const routeSuggestions = [
  { label: "Explore Collections", href: "/products" },
  { label: "Find the Right Board", href: "/products?guide=1" },
  { label: "Customisation Assistance", href: "/customize" },
  { label: "Visualise Your Space", href: "/visualize" },
  { label: "Talk to Our Team", href: "/about#start-project" },
] as const;

const promptSuggestions = [
  "I'm designing an office — where do I start?",
  "A vision board for my studio?",
  "Modern minimal or warm luxe finish?",
  "What size board fits my meeting room?",
];

const chatIvory = "#F5F1E9";
const chatBeige = "#E8DFD2";
const chatGold = "#C8AD89";

const floatKeyframes = {
  "@keyframes obasixFloat": {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-4px)" },
  },
  "@keyframes obasixMsgIn": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "@keyframes obasixDotBounce": {
    "0%, 80%, 100%": { opacity: 0.3, transform: "translateY(0)" },
    "40%": { opacity: 1, transform: "translateY(-3px)" },
  },
};

export function AIChatbot() {
  const pathname = usePathname();
  const hideLauncher = pathname.startsWith("/products") || pathname.startsWith("/checkout");
  const {
    isOpen,
    isLoading,
    messages,
    lastFailedPrompt,
    openChat,
    closeChat,
    minimizeChat,
    sendUserMessage,
    retryLastFailed,
  } = useAIChat();
  const [input, setInput] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);
  const [seenMessageCount, setSeenMessageCount] = useState(messages.length);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.some((message) => message.role === "user")) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 160);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const markSeen = () => setSeenMessageCount(messages.length);

  const handleOpen = () => {
    markSeen();
    openChat();
  };

  const handleClose = () => {
    markSeen();
    closeChat();
  };

  const handleMinimize = () => {
    markSeen();
    minimizeChat();
  };

  const hasUnread = !isOpen && messages.length > seenMessageCount;

  const submit = () => {
    if (!input.trim() || isLoading) return;
    void sendUserMessage(input);
    setInput("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const showSuggestions = messages.filter((m) => m.role === "user").length === 0 && !isLoading;

  return (
    <>
      {hideLauncher || footerVisible ? null : (
        <Tooltip title="Ask OBASIX — design assistant" placement="left" enterDelay={350}>
          <ButtonBase
            type="button"
            onClick={handleOpen}
            aria-label={hasUnread ? "Ask OBASIX, new reply available" : "Ask OBASIX design assistant"}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            sx={{
              ...floatKeyframes,
              position: "fixed",
              zIndex: 1300,
              right: { xs: "max(16px, env(safe-area-inset-right))", sm: 22, md: 24 },
              bottom: {
                xs: "calc(var(--mobile-nav-h, 64px) + 1rem + env(safe-area-inset-bottom, 0px))",
                md: 24,
              },
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: `2px solid ${chatGold}`,
              background: `radial-gradient(circle at 32% 28%, #2A6B51 0%, ${brandTokens.forest} 52%, ${brandTokens.forestDark} 100%)`,
              color: brandTokens.white,
              boxShadow:
                "0 16px 36px rgba(23, 77, 56, 0.38), 0 4px 10px rgba(37, 42, 38, 0.18), inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -2px 6px rgba(11, 44, 31, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "obasixFloat 3.2s ease-in-out infinite",
              "&:hover, &:focus-visible": { animationPlayState: "paused" },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              transition:
                "background 0.25s ease, box-shadow 0.25s ease, opacity 0.2s ease",
              "&:hover": {
                boxShadow:
                  "0 20px 44px rgba(23, 77, 56, 0.45), 0 5px 12px rgba(37, 42, 38, 0.2), inset 0 1px 1px rgba(255,255,255,0.22)",
              },
              "&:focus-visible": {
                outline: `2px solid ${chatGold}`,
                outlineOffset: 4,
              },
              ...(isOpen && { pointerEvents: "none", opacity: 0, transform: "translateY(8px)" }),
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 26, color: "#F3E7CE" }} />
            <Box
              component="span"
              aria-hidden
              sx={{
                position: "absolute",
                top: 2,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: chatGold,
                boxShadow: "0 0 0 2px rgba(23,77,56,0.85)",
              }}
            />
            {hasUnread ? (
              <Box
                component="span"
                aria-hidden
                sx={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  bgcolor: brandTokens.secondary,
                  border: "2px solid #FFFFFF",
                }}
              />
            ) : null}
          </ButtonBase>
        </Tooltip>
      )}

      <Paper
        component="section"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descId}
        variant="outlined"
        sx={{
          position: "fixed",
          zIndex: 1400,
          left: { xs: "max(8px, env(safe-area-inset-left))", sm: "auto" },
          right: { xs: "max(8px, env(safe-area-inset-right))", sm: 20, md: 24 },
          bottom: {
            xs: "calc(var(--mobile-nav-h, 64px) + 0.5rem + env(safe-area-inset-bottom, 0px))",
            sm: "calc(22px + 60px + 0.75rem)",
            md: "calc(24px + 60px + 0.75rem)",
          },
          display: "flex",
          width: { xs: "auto", sm: 380, md: 400 },
          height: {
            xs: "calc(100dvh - var(--mobile-nav-h, 64px) - 1rem - env(safe-area-inset-bottom, 0px))",
            sm: "min(calc(100dvh - 7.5rem), 580px)",
          },
          maxHeight: {
            xs: "calc(100dvh - 5rem)",
            sm: "calc(100dvh - 7.5rem)",
          },
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: { xs: "20px", sm: "20px" },
          borderColor: chatBeige,
          bgcolor: brandTokens.white,
          boxShadow: "0 24px 70px rgba(23, 77, 56, 0.22), 0 8px 24px rgba(37, 42, 38, 0.12)",
          transformOrigin: "bottom right",
          transition:
            "opacity 0.24s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(10px) scale(0.985)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderBottom: 1,
            borderColor: "rgba(255,255,255,0.12)",
            bgcolor: brandTokens.forest,
            color: brandTokens.white,
            px: { xs: 1.25, sm: 1.75 },
            py: 1.25,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1.1} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 56, sm: 76 },
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Image
                src="/assets/obasix-logo-official.png"
                alt="OBASIX"
                width={550}
                height={182}
                sizes="(max-width: 599px) 56px, 76px"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Box>
            <Box
              aria-hidden
              sx={{
                width: "1px",
                height: 30,
                bgcolor: "rgba(255,255,255,0.16)",
                flexShrink: 0,
                display: { xs: "none", sm: "block" },
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                id={titleId}
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 13, sm: 14.5 },
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                OBASIX Assistant
              </Typography>
              <Stack
                direction="row"
                spacing={0.6}
                sx={{ alignItems: "center", mt: 0.3, minWidth: 0 }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#8FD3A6",
                    boxShadow: "0 0 0 2px rgba(143,211,166,0.16)",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  id={descId}
                  aria-label="Online. Help with boards, sizes and customisation."
                  sx={{
                    fontSize: 10.5,
                    lineHeight: 1.35,
                    color: "rgba(255,255,255,0.78)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Online
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    {" "}
                    · Boards, sizes &amp; customisation
                  </Box>
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={handleMinimize}
              aria-label="Minimize chat"
              sx={{
                color: "rgba(255,255,255,0.8)",
                "&:hover": { color: brandTokens.white, bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleClose}
              aria-label="Close chat"
              sx={{
                color: "rgba(255,255,255,0.8)",
                "&:hover": { color: brandTokens.white, bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack
          spacing={1.25}
          className="scrollbar-thin"
          sx={{ flex: 1, minHeight: 0, overflowY: "auto", bgcolor: chatIvory, p: 1.75 }}
          aria-live="polite"
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <Box
                key={message.id}
                sx={{
                  ...floatKeyframes,
                  maxWidth: "92%",
                  px: 1.5,
                  py: 1.15,
                  borderRadius: 0,
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  animation: "obasixMsgIn 0.3s ease both",
                  ...(isUser
                    ? { ml: "auto", bgcolor: brandTokens.forest, color: brandTokens.white }
                    : {
                        border: 1,
                        borderColor: message.error ? chatBeige : brandTokens.line,
                        bgcolor: message.error ? chatBeige : brandTokens.white,
                      }),
                }}
              >
                <Typography
                  component="p"
                  sx={{
                    whiteSpace: "pre-line",
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    color: isUser ? "inherit" : brandTokens.charcoal,
                  }}
                >
                  {message.content}
                </Typography>

                {message.error && message.retryable && lastFailedPrompt ? (
                  <Button
                    size="small"
                    startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                    onClick={() => void retryLastFailed()}
                    disabled={isLoading}
                    sx={{
                      mt: 1.25,
                      bgcolor: brandTokens.white,
                      color: brandTokens.forest,
                      border: `1px solid ${brandTokens.oak}`,
                      fontWeight: 700,
                      "&:hover": { bgcolor: brandTokens.ivory, borderColor: brandTokens.forest },
                    }}
                  >
                    Retry
                  </Button>
                ) : null}

                {message.links?.length ? (
                  <Stack spacing={0.65} sx={{ mt: 1.15 }}>
                    {message.links.map((link) => (
                      <Button
                        key={link.href + link.label}
                        component={Link}
                        href={link.href}
                        onClick={handleClose}
                        size="small"
                        variant="outlined"
                        sx={{
                          justifyContent: "flex-start",
                          borderColor: brandTokens.oak,
                          color: brandTokens.forest,
                          bgcolor: brandTokens.white,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {link.label}
                      </Button>
                    ))}
                  </Stack>
                ) : null}

                {message.recommendations?.length ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: brandTokens.forest,
                      }}
                    >
                      From the catalogue
                    </Typography>
                    {message.recommendations.map((rec) => (
                      <AIProductCard
                        key={rec.productId}
                        productId={rec.productId}
                        reason={rec.reason}
                        customizerPrefill={rec.customizerPrefill}
                        onNavigate={handleClose}
                      />
                    ))}
                  </Box>
                ) : null}

                {message.customizerCta ? (
                  <Button
                    component={Link}
                    href={buildCustomizeHref(message.customizerCta.prefill)}
                    onClick={handleClose}
                    variant="contained"
                    sx={{
                      mt: 1.25,
                      borderRadius: 0,
                      px: 1.5,
                      py: 0.9,
                      fontSize: 12,
                      bgcolor: brandTokens.forest,
                      "&:hover": { bgcolor: brandTokens.forestDark },
                    }}
                  >
                    {message.customizerCta.label}
                  </Button>
                ) : null}
              </Box>
            );
          })}

          {isLoading ? (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: "center",
                alignSelf: "flex-start",
                border: 1,
                borderColor: brandTokens.line,
                bgcolor: brandTokens.white,
                borderRadius: 0,
                px: 1.5,
                py: 1.1,
                ...floatKeyframes,
                animation: "obasixMsgIn 0.3s ease both",
              }}
              aria-label="OBASIX Assistant is typing"
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  aria-hidden
                  sx={{
                    ...floatKeyframes,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: brandTokens.forest,
                    opacity: 0.3,
                    animation: `obasixDotBounce 1.1s ease-in-out ${i * 0.16}s infinite`,
                  }}
                />
              ))}
              <Typography sx={{ ml: 0.75, fontSize: 12.5, color: brandTokens.muted, alignSelf: "center" }}>
                Typing…
              </Typography>
            </Stack>
          ) : null}

          {showSuggestions ? (
            <Box sx={{ pt: 0.5 }}>
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: brandTokens.forest,
                  }}
                >
                  Quick actions
                </Typography>
                <Typography sx={{ fontSize: 10, color: brandTokens.muted }}>
                  Pick a starting point
                </Typography>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.625 }}>
                {routeSuggestions.map((item, idx) => (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    onClick={handleClose}
                    size="small"
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      minWidth: 0,
                      px: 1.1,
                      py: 0.85,
                      border: `1px solid ${chatBeige}`,
                      bgcolor: brandTokens.white,
                      color: brandTokens.forest,
                      borderRadius: 0,
                      fontSize: 11.5,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      textTransform: "none",
                      ...(idx === routeSuggestions.length - 1 && routeSuggestions.length % 2 === 1
                        ? { gridColumn: "1 / -1" }
                        : {}),
                      boxShadow: "0 1px 2px rgba(37, 42, 38, 0.04)",
                      "&:hover": {
                        bgcolor: brandTokens.paleGreen,
                        borderColor: brandTokens.oak,
                        color: brandTokens.forestDark,
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              <Typography
                sx={{
                  mt: 1.4,
                  mb: 0.75,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: brandTokens.muted,
                }}
              >
                Or ask
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.55 }}>
                {promptSuggestions.map((q) => (
                  <ButtonBase
                    key={q}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void sendUserMessage(q)}
                    sx={{
                      border: `1px solid ${chatBeige}`,
                      bgcolor: "rgba(255,255,255,0.72)",
                      color: brandTokens.charcoal,
                      borderRadius: "999px",
                      px: 1.1,
                      py: 0.5,
                      fontSize: 10.5,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      textAlign: "left",
                      "&:hover": { bgcolor: brandTokens.white, borderColor: brandTokens.oak },
                    }}
                  >
                    {q}
                  </ButtonBase>
                ))}
              </Stack>
            </Box>
          ) : null}

          <div ref={endRef} />
        </Stack>

        <Stack
          component="form"
          direction="row"
          spacing={1}
          onSubmit={onSubmit}
          sx={{
            alignItems: "flex-end",
            borderTop: `1px solid ${chatBeige}`,
            bgcolor: brandTokens.white,
            p: 1.35,
            flexShrink: 0,
          }}
        >
          <InputBase
            inputRef={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            multiline
            maxRows={3}
            placeholder="Tell me about the space you're imagining…"
            inputProps={{ "aria-label": "Message OBASIX Assistant" }}
            disabled={isLoading}
            sx={{
              flex: 1,
              border: `1px solid ${chatBeige}`,
              bgcolor: chatIvory,
              borderRadius: 0,
              px: 1.35,
              py: 0.85,
              fontSize: 13.5,
              "&.Mui-focused": { borderColor: brandTokens.forest, bgcolor: brandTokens.white },
            }}
          />
          <IconButton
            type="submit"
            aria-label="Send message"
            disabled={isLoading || !input.trim()}
            sx={{
              height: 40,
              width: 40,
              borderRadius: 0,
              bgcolor: brandTokens.forest,
              color: brandTokens.white,
              "&:hover": { bgcolor: brandTokens.forestDark },
              "&.Mui-disabled": {
                bgcolor: brandTokens.beige,
                color: brandTokens.muted,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={16} thickness={5} sx={{ color: brandTokens.muted }} />
            ) : (
              <SendIcon sx={{ fontSize: 17 }} />
            )}
          </IconButton>
        </Stack>
      </Paper>
    </>
  );
}
