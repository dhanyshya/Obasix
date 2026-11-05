export type CheckoutAddress = {
  line: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

export type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  billing: CheckoutAddress;
  shipping: CheckoutAddress;
  sameAsBilling: boolean;
};

export type CommerceCode =
  | "provider_not_configured"
  | "provider_not_implemented"
  | "tracking_unavailable"
  | "invalid_request"
  | "payment_failed"
  | "payment_cancelled";

export type CommerceResponse = {
  ok: false;
  code: CommerceCode;
  charged: false;
  orderCreated: false;
  message: string;
  required?: string[];
};

export type OrderStatus =
  | "Order Placed"
  | "Payment Confirmed"
  | "Processing"
  | "Dispatched"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Pending Payment";

export const commerceRequirements = [
  "ORDER_API_URL",
  "ORDER_API_TOKEN",
  "PAYMENT_WEBHOOK_SECRET",
] as const;
