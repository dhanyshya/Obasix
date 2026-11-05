"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import NextLink from "@/components/Link";
import { useAuth } from "@/context/AuthContext";
import type { CartConfiguration } from "@/lib/types";

export function SaveConfigurationButton({
  productId,
  quantity,
  configuration,
}: {
  productId: string;
  quantity: number;
  configuration: CartConfiguration;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <Button component={NextLink} href="/login?next=/customize" variant="outlined" color="inherit" fullWidth sx={{ minHeight: 48 }}>
        Sign in to save this board
      </Button>
    );
  }

  return (
    <Stack
      component="form"
      spacing={1.5}
      sx={{ width: "100%", minWidth: 0, alignItems: "stretch" }}
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage("");
        const response = await fetch("/api/account?action=configuration", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, productId, quantity, configuration }),
        });
        const result = (await response.json()) as { message?: string };
        setSaved(response.ok);
        setMessage(response.ok ? "Saved to your account." : result.message || "The configuration was not saved.");
      }}
    >
      <TextField
        id="save-config-name"
        label="Save this board"
        placeholder="Name this configuration"
        value={name}
        onChange={(event) => setName(event.target.value)}
        fullWidth
        sx={{
          width: "100%",
          "& .MuiInputBase-root": { minHeight: 48 },
          "& .MuiInputBase-input": { minWidth: 0 },
        }}
      />
      <Button
        type="submit"
        variant="outlined"
        color="inherit"
        fullWidth
        sx={{ minHeight: 48, px: 2, py: 1.125, whiteSpace: "normal" }}
      >
        Save to my account
      </Button>
      {message ? <Alert severity={saved ? "success" : "error"}>{message}</Alert> : null}
    </Stack>
  );
}
