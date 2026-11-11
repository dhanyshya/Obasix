import type { OrderStatus } from "@/lib/commerce/types";

const STORAGE_KEY = "obasix-demo-orders";

export type DemoPaymentMethod = "upi" | "card" | "cod";

export type DemoOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type DemoOrderAddress = {
  line: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

export type DemoOrder = {
  id: string;
  idempotencyKey: string;
  method: DemoPaymentMethod;
  email: string;
  phone: string;
  items: DemoOrderItem[];
  subtotal: number;
  status: OrderStatus;
  createdAt?: string;
  customerName?: string;
  shippingAddress?: DemoOrderAddress;
  paymentStatus?: "paid";
};

export const demoPaymentMethodLabel: Record<DemoPaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  cod: "Cash on Delivery",
};

export const orderTimelineSteps = [
  { label: "Order Placed", status: "Order Placed" },
  { label: "Order Confirmed", status: "Payment Confirmed" },
  { label: "Processing", status: "Processing" },
  { label: "Shipped", status: "Dispatched" },
  { label: "Out for Delivery", status: "Out for Delivery" },
  { label: "Delivered", status: "Delivered" },
] as const;

export function completedTimelineSteps(status: OrderStatus) {
  const current = statusOrder.indexOf(status);
  if (current < 0) return 0;
  return current + 1;
}

const statusOrder: OrderStatus[] = [
  "Order Placed",
  "Payment Confirmed",
  "Processing",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

/**
 * The server is the source of truth for demo orders (see /api/commerce/orders).
 * This browser keeps a copy of orders it placed so the confirmation page can render without a lookup form.
 */
function readAll(): DemoOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoOrder[]) : [];
  } catch {
    return [];
  }
}

export function findDemoOrder(id: string) {
  return readAll().find((order) => order.id === id);
}

export function rememberDemoOrder(order: DemoOrder) {
  try {
    const orders = readAll().filter((item) => item.id !== order.id);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...orders, order].slice(-10)));
  } catch {
    // Storage blocked: the order is still saved on the server and can be tracked.
  }
}
