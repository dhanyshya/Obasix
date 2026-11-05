"use client";

import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Stepper from "@mui/material/Stepper";
import Link from "@/components/Link";

const steps = [
  { href: "/checkout", label: "Checkout" },
  { href: "/checkout/payment", label: "Payment" },
  { href: "/checkout/confirmation", label: "Confirmation" },
  { href: "/orders/track", label: "Track Order" },
];

export function PurchaseSteps({ current }: { current: number }) {
  return (
    <Box sx={{ mt: 3, maxWidth: 720 }}>
      <Stepper nonLinear alternativeLabel activeStep={current} aria-label="Purchase steps">
        {steps.map((step, index) => (
          <Step key={step.label} completed={index < current}>
            <StepButton
              component={Link}
              href={step.href}
              aria-current={index === current ? "step" : undefined}
            >
              {step.label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
