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

function readAll(): DemoOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoOrder[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: DemoOrder[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function demoOrderId(idempotencyKey: string) {
  return `OBX-DEMO-${idempotencyKey.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function findDemoOrder(id: string) {
  return readAll().find((order) => order.id === id);
}

export function saveDemoOrder(order: DemoOrder) {
  const orders = readAll();
  const existing = orders.find((item) => item.idempotencyKey === order.idempotencyKey);
  if (existing) return existing;
  writeAll([...orders, order]);
  return order;
}

export function advanceDemoOrder(id: string) {
  const orders = readAll();
  const index = orders.findIndex((order) => order.id === id);
  if (index < 0) return undefined;
  const current = statusOrder.indexOf(orders[index].status);
  const next = statusOrder[Math.min(current + 1, statusOrder.length - 1)];
  orders[index] = { ...orders[index], status: next };
  writeAll(orders);
  return orders[index];
}

export function contactMatches(order: DemoOrder, contact: string) {
  const value = contact.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  if (value === order.email.trim().toLowerCase()) return true;
  return digits.length >= 8 && digits === order.phone.replace(/\D/g, "");
}
