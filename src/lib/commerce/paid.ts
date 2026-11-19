import "server-only";

import { recordOrderCommission } from "@/lib/associates/store";
import type { DemoOrder } from "@/lib/commerce/demo-orders";

/**
 * Runs once per order, when its payment is first confirmed (see markOrderPaid).
 * Anything that should happen only for paid orders belongs here.
 */
export async function afterOrderPaid(input: { order: DemoOrder; referralCode: string | null; userId: string | null }) {
  try {
    recordOrderCommission({
      orderId: input.order.id,
      subtotal: input.order.subtotal,
      code: input.referralCode,
      buyerUserId: input.userId,
      buyerEmail: input.order.email,
    });
  } catch {
    // The payment stands even if the associate ledger can't be written; staff can add it later.
  }
}
