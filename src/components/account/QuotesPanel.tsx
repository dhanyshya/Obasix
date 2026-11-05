"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Quote = { reference: string; summary: string; created_at: string };

export function QuotesPanel() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);

  useEffect(() => {
    void fetch("/api/account")
      .then((response) => response.json())
      .then((data) => setQuotes(data.quotes ?? []));
  }, []);

  return (
    <Box>
      <Typography component="h1" variant="h4">
        Quotes
      </Typography>
      {quotes === null ? (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          Loading quotes...
        </Typography>
      ) : null}
      {quotes?.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          No quote requests are saved for this account. Guest quotes are not attached after the fact.
        </Typography>
      ) : null}
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {quotes?.map((quote) => (
          <Paper key={quote.reference} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {quote.reference}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {quote.summary}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Received · {quote.created_at.slice(0, 10)}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
