"use client";

import { FormEvent, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AuthPasswordField, AuthTextField } from "@/components/auth/AuthFields";
import { useAuth } from "@/context/AuthContext";

type Address = { id: string; line: string; city: string; state: string; postal: string; country: string };

const twoColumns = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } } as const;

export function ProfilePanel() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [line, setLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("India");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone);
    setCompany(user.company);
    void fetch("/api/account")
      .then((response) => response.json())
      .then((data) => setAddresses(data.addresses ?? []));
  }, [user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/account?action=profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, company }),
    });
    const result = (await response.json()) as { errors?: { name?: string; phone?: string } };
    if (!response.ok) {
      setError(result.errors?.name || result.errors?.phone || "The profile was not saved.");
      return;
    }
    await refresh();
    setMessage("Profile saved.");
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/account?action=password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const result = (await response.json()) as { errors?: { current?: string; next?: string } };
    if (!response.ok) {
      setError(result.errors?.current || result.errors?.next || "The password was not changed.");
      return;
    }
    setCurrent("");
    setNext("");
    setMessage("Password updated.");
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/account?action=address", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ line, city, state, postal, country }),
    });
    if (!response.ok) {
      setError("Enter a complete address.");
      return;
    }
    setLine("");
    setCity("");
    setState("");
    setPostal("");
    const data = await fetch("/api/account").then((item) => item.json());
    setAddresses(data.addresses ?? []);
    setMessage("Address saved.");
  };

  return (
    <Stack spacing={4}>
      <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>
        Profile
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}
      <Paper variant="outlined" component="form" onSubmit={saveProfile} sx={{ p: 2, ...twoColumns }}>
        <AuthTextField id="profile-name" label="Name" value={name} onChange={setName} autoComplete="name" />
        <AuthTextField id="profile-phone" label="Phone" value={phone} onChange={setPhone} autoComplete="tel" />
        <AuthTextField id="profile-company" label="Company" value={company} onChange={setCompany} autoComplete="organization" />
        <Typography variant="body2" color="text.secondary">
          Email {user?.email}. Email is the sign-in name and is not changed here.
        </Typography>
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <Button type="submit" variant="contained">
            Save profile
          </Button>
        </Box>
      </Paper>
      <Paper variant="outlined" component="form" onSubmit={savePassword} sx={{ p: 2 }}>
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <AuthPasswordField id="profile-current" label="Current password" autoComplete="current-password" value={current} onChange={setCurrent} />
          <AuthPasswordField id="profile-next" label="New password" autoComplete="new-password" value={next} onChange={setNext} />
          <Button type="submit" variant="outlined" color="inherit">
            Change password
          </Button>
        </Stack>
      </Paper>
      <Paper variant="outlined" component="section" sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          Saved addresses
        </Typography>
        {addresses.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No saved addresses.
          </Typography>
        ) : null}
        <List dense disablePadding sx={{ mt: 1 }}>
          {addresses.map((address) => (
            <ListItem
              key={address.id}
              disableGutters
              divider
              secondaryAction={
                <Button
                  size="small"
                  color="inherit"
                  onClick={async () => {
                    await fetch(`/api/account?kind=address&id=${encodeURIComponent(address.id)}`, { method: "DELETE" });
                    setAddresses((items) => items.filter((item) => item.id !== address.id));
                  }}
                >
                  Remove
                </Button>
              }
            >
              <ListItemText primary={[address.line, address.city, address.state, address.postal, address.country].join(", ")} sx={{ pr: 8 }} />
            </ListItem>
          ))}
        </List>
        <Box component="form" onSubmit={saveAddress} sx={{ mt: 2, ...twoColumns }}>
          <AuthTextField id="address-line" label="Address" value={line} onChange={setLine} autoComplete="street-address" />
          <AuthTextField id="address-city" label="City" value={city} onChange={setCity} autoComplete="address-level2" />
          <AuthTextField id="address-state" label="State" value={state} onChange={setState} autoComplete="address-level1" />
          <AuthTextField id="address-postal" label="PIN" value={postal} onChange={setPostal} autoComplete="postal-code" />
          <AuthTextField id="address-country" label="Country" value={country} onChange={setCountry} autoComplete="country-name" />
          <Box sx={{ alignSelf: "end" }}>
            <Button type="submit" variant="outlined" color="inherit">
              Save address
            </Button>
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
