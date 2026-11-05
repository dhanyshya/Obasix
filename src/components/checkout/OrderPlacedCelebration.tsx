"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { keyframes } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BuildIcon from "@mui/icons-material/Build";
import CheckIcon from "@mui/icons-material/Check";
import ChevronDownIcon from "@mui/icons-material/ExpandMore";
import HomeIcon from "@mui/icons-material/Home";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import VerifiedIcon from "@mui/icons-material/Verified";
import type { SvgIconComponent } from "@mui/icons-material";
import Link from "@/components/Link";
import { Confetti } from "@/components/checkout/Confetti";
import {
  completedTimelineSteps,
  demoPaymentMethodLabel,
  orderTimelineSteps,
  type DemoOrder,
} from "@/lib/commerce/demo-orders";
import { formatPrice } from "@/lib/format";
import { brandTokens } from "@/theme/brandTokens";

const circleDraw = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;

const checkDraw = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;

const cardEnter = keyframes`
  from { opacity: 0; transform: translateY(28px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const heroEnter = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatY = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-22px); }
`;

const haloPulse = keyframes`
  0% { transform: scale(0.82); opacity: 0.55; }
  70% { transform: scale(1.28); opacity: 0; }
  100% { transform: scale(1.28); opacity: 0; }
`;

const timelineIcons: SvgIconComponent[] = [
  ReceiptLongIcon,
  VerifiedIcon,
  BuildIcon,
  LocalShippingIcon,
  TwoWheelerIcon,
  HomeIcon,
];

const ambientParticles = [
  { left: "6%", top: "18%", size: 6, delay: "0s", duration: "11s", color: brandTokens.forest },
  { left: "12%", top: "64%", size: 4, delay: "1.4s", duration: "13s", color: brandTokens.accent },
  { left: "22%", top: "32%", size: 3, delay: "0.8s", duration: "9s", color: brandTokens.forest },
  { left: "88%", top: "22%", size: 5, delay: "0.5s", duration: "12s", color: brandTokens.accent },
  { left: "93%", top: "58%", size: 3, delay: "2s", duration: "10s", color: brandTokens.forest },
  { left: "78%", top: "78%", size: 6, delay: "1s", duration: "14s", color: brandTokens.forest },
  { left: "35%", top: "84%", size: 4, delay: "2.4s", duration: "12s", color: brandTokens.accent },
  { left: "65%", top: "12%", size: 4, delay: "1.8s", duration: "11s", color: brandTokens.forest },
];

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAddress(order: DemoOrder) {
  const address = order.shippingAddress;
  if (!address) return null;
  const cityLine = [address.city, address.state].filter(Boolean).join(", ");
  return [order.customerName, address.line, [cityLine, address.postal].filter(Boolean).join(" — "), address.country].filter(
    Boolean,
  );
}

const labelSx = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: brandTokens.muted,
} as const;

const valueSx = {
  mt: 0.5,
  fontSize: 15,
  fontWeight: 600,
  color: brandTokens.charcoal,
  lineHeight: 1.5,
} as const;

export function OrderPlacedCelebration({ order }: { order: DemoOrder }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [showDetails, setShowDetails] = useState(false);
  const completed = completedTimelineSteps(order.status);
  const dateLabel = formatDate(order.createdAt);
  const timeLabel = formatTime(order.createdAt);
  const addressLines = formatAddress(order);
  const paymentStatus =
    order.paymentStatus === "paid" ? "Paid · Demo simulation" : "Awaiting confirmation";

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        backgroundImage:
          "radial-gradient(ellipse 90% 60% at 50% -10%, #FFFFFF 0%, rgba(255,255,255,0) 60%)",
      }}
    >
      <Confetti active={!reducedMotion} />
      {!reducedMotion
        ? ambientParticles.map((particle, index) => (
            <Box
              key={index}
              aria-hidden
              sx={{
                position: "absolute",
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                borderRadius: "50%",
                bgcolor: particle.color,
                opacity: 0.22,
                animation: `${floatY} ${particle.duration} ease-in-out ${particle.delay} infinite alternate`,
                pointerEvents: "none",
                display: { xs: "none", sm: "block" },
              }}
            />
          ))
        : null}

      <Container maxWidth="md" sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 6, md: 9 }, position: "relative" }}>
        {/* ——— Hero ——— */}
        <Box
          role="status"
          aria-live="polite"
          sx={{
            textAlign: "center",
            animation: reducedMotion ? "none" : `${heroEnter} 0.7s ease-out both`,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: 96, md: 116 },
              height: { xs: 96, md: 116 },
              mx: "auto",
            }}
          >
            {!reducedMotion ? (
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px solid ${brandTokens.forest}`,
                  animation: `${haloPulse} 2.4s ease-out 0.9s 2`,
                }}
              />
            ) : null}
            <svg
              viewBox="0 0 120 120"
              width="100%"
              height="100%"
              role="img"
              aria-label="Order confirmed"
            >
              <circle
                cx="60"
                cy="60"
                r="52"
                fill={brandTokens.paleGreen}
                stroke={brandTokens.forest}
                strokeWidth="3.5"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={reducedMotion ? 0 : 100}
                style={
                  reducedMotion
                    ? undefined
                    : { animation: `${circleDraw} 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards` }
                }
              />
              <path
                d="M37.5 62.5 L53.5 78.5 L84 45"
                fill="none"
                stroke={brandTokens.forest}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={reducedMotion ? 0 : 100}
                style={
                  reducedMotion
                    ? undefined
                    : { animation: `${checkDraw} 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.75s forwards` }
                }
              />
            </svg>
          </Box>

          <Typography
            variant="overline"
            sx={{
              display: "block",
              mt: { xs: 3.5, md: 4 },
              color: brandTokens.accent,
              letterSpacing: "0.3em",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Thank You
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1,
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3.15rem" },
              color: brandTokens.charcoal,
            }}
          >
            🎉 Order Placed Successfully!
          </Typography>
          <Typography
            sx={{
              mt: 2,
              mx: "auto",
              maxWidth: 560,
              color: brandTokens.body,
              fontSize: { xs: 15, md: 16.5 },
              lineHeight: 1.75,
            }}
          >
            Thank you for shopping with OBASIX. Your order has been confirmed. We&rsquo;re excited to
            create something special for your space.
          </Typography>
        </Box>

        {/* ——— Demo notice ——— */}
        <Box
          component="aside"
          role="note"
          sx={{
            mt: { xs: 3.5, md: 4 },
            mx: "auto",
            maxWidth: 760,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            px: 1.75,
            py: 1.25,
            bgcolor: "#FBF7EE",
            border: `1px solid ${brandTokens.accent}`,
            borderLeftWidth: 3,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, mt: "1px", color: brandTokens.accent, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12.5, lineHeight: 1.65, color: brandTokens.body }}>
            <Box component="strong" sx={{ color: brandTokens.charcoal, letterSpacing: "0.06em" }}>
              DEMO MODE — NO REAL PAYMENT.
            </Box>{" "}
            This reference exists only in this browser and was not sent to a payment provider or order
            service.
          </Typography>
        </Box>

        {/* ——— Order details card ——— */}
        <Box
          component="section"
          aria-label="Order details"
          sx={{
            mt: { xs: 3, md: 3.5 },
            mx: "auto",
            maxWidth: 760,
            bgcolor: "#FFFFFF",
            border: `1px solid ${brandTokens.line}`,
            boxShadow: "0 24px 56px rgba(37, 42, 38, 0.08)",
            p: { xs: 3, sm: 4, md: 4.5 },
            animation: reducedMotion ? "none" : `${cardEnter} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
          >
            <Box>
              <Typography sx={labelSx}>Order Number</Typography>
              <Typography
                component="p"
                sx={{
                  mt: 0.5,
                  fontSize: { xs: 22, md: 26 },
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: brandTokens.forest,
                  fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
                }}
              >
                {order.id}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.9,
                alignSelf: { xs: "flex-start", sm: "center" },
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                bgcolor: brandTokens.paleGreen,
                border: `1px solid #D5E0D6`,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: brandTokens.forest }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: brandTokens.forest }}>
                CONFIRMED
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: { xs: 2.5, md: 3 }, borderColor: brandTokens.line }} />

          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography sx={labelSx}>Order Date</Typography>
              <Typography sx={valueSx}>{dateLabel}</Typography>
              {timeLabel ? (
                <Typography sx={{ fontSize: 12.5, color: brandTokens.muted, mt: 0.25 }}>{timeLabel}</Typography>
              ) : null}
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography sx={labelSx}>Payment Status</Typography>
              <Typography sx={valueSx}>{paymentStatus}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography sx={labelSx}>Payment Method</Typography>
              <Typography sx={valueSx}>{demoPaymentMethodLabel[order.method] ?? order.method}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography sx={labelSx}>Order Total</Typography>
              <Typography sx={{ ...valueSx, color: brandTokens.forest }}>{formatPrice(order.subtotal)}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography sx={labelSx}>Delivery Address</Typography>
              {addressLines ? (
                <Typography sx={{ ...valueSx, fontWeight: 500 }}>
                  {addressLines.map((line, index) => (
                    <Box component="span" key={index} sx={{ display: "block" }}>
                      {line}
                    </Box>
                  ))}
                </Typography>
              ) : (
                <Typography sx={{ ...valueSx, fontWeight: 500, color: brandTokens.muted }}>
                  Address not recorded for this demo order.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Collapse in={showDetails} id="order-summary" unmountOnExit>
            <Divider sx={{ my: 2.5, borderColor: brandTokens.line }} />
            <Typography sx={labelSx}>Items ({order.items.length})</Typography>
            <Stack component="ul" spacing={1.25} sx={{ m: 0, mt: 1.5, p: 0, listStyle: "none" }}>
              {order.items.map((item) => (
                <Stack
                  key={item.productId}
                  component="li"
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "space-between", alignItems: "baseline" }}
                >
                  <Typography sx={{ fontSize: 14, color: brandTokens.body, lineHeight: 1.55 }}>
                    {item.name} · Qty {item.quantity}
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: brandTokens.charcoal, whiteSpace: "nowrap" }}>
                    {formatPrice(item.lineTotal)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 2, borderColor: brandTokens.line }} />
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: brandTokens.charcoal }}>
                CATALOGUE SUBTOTAL
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: brandTokens.forest }}>
                {formatPrice(order.subtotal)}
              </Typography>
            </Stack>
            <Typography sx={{ mt: 1.25, fontSize: 12, color: brandTokens.muted, lineHeight: 1.6 }}>
              Shipping, tax, courier and delivery date are not included and will be confirmed separately.
            </Typography>
          </Collapse>
        </Box>

        {/* ——— Tracking timeline ——— */}
        <Box
          component="section"
          aria-label="Order tracking progress"
          sx={{
            mt: { xs: 3, md: 4 },
            mx: "auto",
            maxWidth: 760,
            bgcolor: "#FFFFFF",
            border: `1px solid ${brandTokens.line}`,
            p: { xs: 3, sm: 4 },
          }}
        >
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", mb: { xs: 2.5, md: 3.5 } }}>
            <Box>
              <Typography sx={labelSx}>Tracking</Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 0.5,
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontWeight: 500,
                  fontSize: { xs: 20, md: 23 },
                  color: brandTokens.charcoal,
                  letterSpacing: "-0.01em",
                }}
              >
                Your order journey
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: brandTokens.muted }}>
              {completed} of {orderTimelineSteps.length} complete
            </Typography>
          </Stack>

          {/* Desktop horizontal timeline */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "flex-start" }}>
            {orderTimelineSteps.map((step, index) => {
              const Icon = timelineIcons[index];
              const done = index < completed;
              const isLast = index === orderTimelineSteps.length - 1;
              return (
                <Box key={step.label} sx={{ display: "flex", alignItems: "flex-start", flex: isLast ? "0 0 auto" : 1 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96 }}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: done ? brandTokens.forest : "#F4F3EE",
                        border: done ? `1px solid ${brandTokens.forest}` : `1px solid ${brandTokens.line}`,
                        boxShadow: done ? "0 6px 16px rgba(22, 78, 59, 0.3)" : "none",
                      }}
                    >
                      {done ? (
                        <CheckIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
                      ) : (
                        <Icon sx={{ fontSize: 21, color: brandTokens.muted }} />
                      )}
                    </Box>
                    <Typography
                      sx={{
                        mt: 1.25,
                        fontSize: 11.5,
                        fontWeight: done ? 700 : 500,
                        textAlign: "center",
                        lineHeight: 1.35,
                        color: done ? brandTokens.charcoal : brandTokens.muted,
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: done ? brandTokens.forest : "#A9ACA4",
                      }}
                    >
                      {done ? "Done" : "Pending"}
                    </Typography>
                  </Box>
                  {!isLast ? (
                    <Box
                      aria-hidden
                      sx={{
                        flex: 1,
                        height: 2,
                        mt: "22px",
                        mx: 0.5,
                        bgcolor: index < completed - 1 ? brandTokens.forest : brandTokens.line,
                      }}
                    />
                  ) : null}
                </Box>
              );
            })}
          </Box>

          {/* Mobile vertical timeline */}
          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column" }}>
            {orderTimelineSteps.map((step, index) => {
              const Icon = timelineIcons[index];
              const done = index < completed;
              const isLast = index === orderTimelineSteps.length - 1;
              return (
                <Box key={step.label} sx={{ display: "flex", gap: 2, position: "relative", pb: isLast ? 0 : 2.5 }}>
                  {!isLast ? (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        left: 22,
                        top: 46,
                        bottom: 2,
                        width: 2,
                        bgcolor: index < completed - 1 ? brandTokens.forest : brandTokens.line,
                      }}
                    />
                  ) : null}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: done ? brandTokens.forest : "#F4F3EE",
                      border: done ? `1px solid ${brandTokens.forest}` : `1px solid ${brandTokens.line}`,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {done ? (
                      <CheckIcon sx={{ fontSize: 21, color: "#FFFFFF" }} />
                    ) : (
                      <Icon sx={{ fontSize: 20, color: brandTokens.muted }} />
                    )}
                  </Box>
                  <Box sx={{ pt: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        fontWeight: done ? 700 : 500,
                        color: done ? brandTokens.charcoal : brandTokens.muted,
                        lineHeight: 1.35,
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        mt: 0.25,
                        color: done ? brandTokens.forest : "#A9ACA4",
                      }}
                    >
                      {done ? "Completed" : "Pending"}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ——— Actions ——— */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          useFlexGap
          spacing={1.5}
          sx={{
            mt: { xs: 3.5, md: 4.5 },
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            component={Link}
            href={`/orders/track?order=${encodeURIComponent(order.id)}`}
            variant="contained"
            endIcon={<LocalShippingIcon sx={{ fontSize: 18 }} />}
            sx={{
              width: { xs: "100%", sm: "auto" },
              height: 52,
              px: 4,
              fontSize: "0.74rem",
              letterSpacing: "0.14em",
            }}
          >
            Track My Order
          </Button>
          <Button
            component={Link}
            href="/products"
            variant="outlined"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            sx={{
              width: { xs: "100%", sm: "auto" },
              height: 52,
              px: 4,
              fontSize: "0.74rem",
              letterSpacing: "0.14em",
              borderColor: brandTokens.forest,
              color: brandTokens.forest,
              "&:hover": { borderColor: brandTokens.forestDark, bgcolor: brandTokens.paleGreen },
            }}
          >
            Continue Shopping
          </Button>
          <Button
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            aria-controls="order-summary"
            endIcon={
              <ChevronDownIcon
                sx={{
                  fontSize: 20,
                  transform: showDetails ? "rotate(180deg)" : "none",
                  transition: "transform 0.25s ease",
                }}
              />
            }
            sx={{
              width: { xs: "100%", sm: "auto" },
              height: 52,
              px: 3,
              fontSize: "0.74rem",
              letterSpacing: "0.14em",
              color: brandTokens.forest,
              "&:hover": { bgcolor: brandTokens.paleGreen },
            }}
          >
            {showDetails ? "Hide Order Details" : "View Order Details"}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
