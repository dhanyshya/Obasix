"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/Link";
import { getProductById } from "@/data/catalogue";
import { useAuth } from "@/context/AuthContext";

type Config = { id: string; name: string; product_id: string; payload: string };
type Quote = { reference: string; summary: string; created_at: string };

const shortcuts = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/quotes", label: "Quotes" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile and addresses" },
];

export function AccountOverview() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    void fetch("/api/account")
      .then((response) => response.json())
      .then((data) => {
        setConfigs(data.configurations ?? []);
        setQuotes(data.quotes ?? []);
      });
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 }, color: "text.primary" }}>
          My account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {user ? `Signed in as ${user.name}` : "Loading your account..."}
        </Typography>
      </Box>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" } }}>
        {shortcuts.map((item) => (
          <Paper key={item.href} variant="outlined" component={NextLink} href={item.href} sx={{ p: 2.5, fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", color: "text.primary", boxShadow: "inset 0 3px 0 transparent", transition: "box-shadow 200ms cubic-bezier(0.16,1,0.3,1)", "&:hover": { boxShadow: "inset 0 3px 0 #EE6A1F" } }}>
            {item.label}
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" component="section" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          Saved board configurations
        </Typography>
        {configs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Save a configuration from Customize while you are signed in.
          </Typography>
        ) : null}
        <List dense disablePadding sx={{ mt: 1 }}>
          {configs.map((config) => (
            <ListItem
              key={config.id}
              disableGutters
              divider
              secondaryAction={
                <Button
                  size="small"
                  color="inherit"
                  onClick={async () => {
                    await fetch(`/api/account?kind=configuration&id=${encodeURIComponent(config.id)}`, { method: "DELETE" });
                    setConfigs((current) => current.filter((item) => item.id !== config.id));
                  }}
                >
                  Remove
                </Button>
              }
            >
              <ListItemText primary={`${config.name} · ${getProductById(config.product_id)?.shortName ?? config.product_id}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Paper variant="outlined" component="section" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          Recent quotes
        </Typography>
        {quotes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Quote requests saved to this account will appear here.
          </Typography>
        ) : null}
        <List dense disablePadding sx={{ mt: 1 }}>
          {quotes.slice(0, 3).map((quote) => (
            <ListItem key={quote.reference} disableGutters>
              <ListItemText primary={`${quote.reference} · ${quote.summary}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
