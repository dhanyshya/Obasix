import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";

export default function NotFound() {
  return (
    <Container
      sx={{
        display: "flex",
        minHeight: "50vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        textAlign: "center",
      }}
    >
      <Typography variant="overline" sx={{ color: "warning.main", fontWeight: 700, letterSpacing: "0.14em" }}>
        404
      </Typography>
      <Typography variant="h1" sx={{ mt: 1.5, fontSize: "2.25rem", fontWeight: 700 }}>
        Page not found
      </Typography>
      <Typography sx={{ mt: 1.5, maxWidth: 448, color: "text.secondary" }}>
        The board or page you&apos;re looking for isn&apos;t available. Explore the catalogue or return home.
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 4 }}>
        <Button component={Link} href="/" variant="outlined" color="primary">
          Home
        </Button>
        <Button component={Link} href="/products" variant="contained" color="primary">
          Browse products
        </Button>
      </Stack>
    </Container>
  );
}
