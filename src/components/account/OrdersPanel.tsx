import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function OrdersPanel() {
  return (
    <Box>
      <Typography component="h1" variant="h4">
        Orders
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 560 }}>
        Order history is not available. This store does not keep customer orders in an order database yet, so none are listed here.
      </Typography>
    </Box>
  );
}
