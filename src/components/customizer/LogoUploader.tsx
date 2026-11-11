"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const maxLogoBytes = 2 * 1024 * 1024;
const allowedTypes = new Set(["image/png", "image/jpeg"]);

export function LogoUploader({
  enabled,
  logoDataUrl,
  onToggle,
  onUpload,
}: {
  enabled: boolean;
  logoDataUrl?: string;
  onToggle: (enabled: boolean) => void;
  onUpload: (dataUrl?: string) => void;
}) {
  const [error, setError] = useState("");

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Add Branding
      </Typography>
      <FormControlLabel
        sx={{ mb: 1 }}
        control={
          <Checkbox
            size="small"
            checked={enabled}
            onChange={(e) => {
              setError("");
              onToggle(e.target.checked);
            }}
          />
        }
        label={<Typography variant="body2">Add company logo to board preview</Typography>}
      />
      {enabled ? (
        <Paper
          variant="outlined"
          sx={{
            borderStyle: "dashed",
            borderRadius: "16px",
            bgcolor: "background.default",
            px: 2,
            py: 3,
            textAlign: "center",
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: "center" }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon />}
              sx={{ py: 1, px: 2 }}
            >
              {logoDataUrl ? "Replace logo" : "Upload Logo"}
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (!allowedTypes.has(file.type)) {
                    setError("Use a PNG or JPG image.");
                    return;
                  }
                  if (file.size > maxLogoBytes) {
                    setError("Logo must be 2 MB or smaller.");
                    return;
                  }
                  setError("");
                  const reader = new FileReader();
                  reader.onload = () => onUpload(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              PNG or JPG, up to 2 MB
            </Typography>
            {logoDataUrl ? (
              <Stack spacing={1} sx={{ alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoDataUrl} alt="Uploaded logo" style={{ height: 48, objectFit: "contain" }} />
                <Button
                  size="small"
                  color="inherit"
                  sx={{ py: 0.5, px: 1.5 }}
                  onClick={() => {
                    setError("");
                    onUpload(undefined);
                  }}
                >
                  Remove logo
                </Button>
              </Stack>
            ) : null}
            {error ? (
              <Alert severity="error" role="alert" sx={{ width: "100%", textAlign: "left" }}>
                {error}
              </Alert>
            ) : null}
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}
