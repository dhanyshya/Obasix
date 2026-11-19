import "server-only";

import { recordOrderCommission } from "@/lib/associates/store";
import { isDemoOrder, type DemoOrder } from "@/lib/commerce/demo-orders";
import { sendEmail, staffAlertEmails } from "@/lib/email/send";
import { deductStock } from "@/lib/stock/store";
import { orderConfirmationEmail, staffNewOrderEmail } from "@/lib/email/templates";

/**
 * Runs once per order, when its payment is first confirmed (see markOrderPaid).
 * Anything that should happen only for paid orders belongs here.
 */
export async function afterOrderPaid(input: { order: DemoOrder; referralCode: string | null; userId: string | null }) {
  try {
    await recordOrderCommission({
      orderId: input.order.id,
      subtotal: input.order.subtotal,
      code: input.referralCode,
      buyerUserId: input.userId,
      buyerEmail: input.order.email,
    });
  } catch {
    // The payment stands even if the associate ledger can't be written; staff can add it later.
  }
  // Demo orders are simulations: they don't touch stock, and nobody should get an email about them.
  if (!isDemoOrder(input.order)) {
    try {
      await deductStock(input.order.items, input.order.id);
    } catch {
      // Stock is a guide for staff; a failed update mustn't undo a confirmed payment.
    }
    await Promise.all([
      sendEmail({ to: input.order.email, ...orderConfirmationEmail(input.order) }),
      sendEmail({ to: staffAlertEmails(), ...staffNewOrderEmail(input.order) }),
    ]);
  }
}
