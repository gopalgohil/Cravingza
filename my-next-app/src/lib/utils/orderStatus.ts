export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type UIStageIndex = 0 | 1 | 2 | 3 | -1;

export interface UIStageInfo {
  index: UIStageIndex;
  label: string;
  isCancelled: boolean;
  activeStageLabel: string;
  statusDescription: string;
}

/**
 * Shared order status mapping utility.
 * Maps 8 backend status values to 4 UI stepper stages:
 * - "placed" | "accepted" -> Stage 0 ("Placed")
 * - "preparing" -> Stage 1 ("Preparing")
 * - "ready_for_pickup" | "picked_up" | "out_for_delivery" -> Stage 2 ("On the Way")
 * - "delivered" -> Stage 3 ("Arrived")
 * - "cancelled" -> Cancelled state (-1)
 */
export function getUIStageInfo(status: string): UIStageInfo {
  const normalized = (status || "").toLowerCase() as OrderStatus;

  switch (normalized) {
    case "placed":
      return {
        index: 0,
        label: "Placed",
        isCancelled: false,
        activeStageLabel: "Order Placed",
        statusDescription: "Order received at restaurant. Awaiting confirmation.",
      };
    case "accepted":
      return {
        index: 0,
        label: "Placed",
        isCancelled: false,
        activeStageLabel: "Order Accepted",
        statusDescription: "Restaurant has accepted your order.",
      };
    case "preparing":
      return {
        index: 1,
        label: "Preparing",
        isCancelled: false,
        activeStageLabel: "Food Being Prepared",
        statusDescription: "Chef is preparing your delicious meal.",
      };
    case "ready_for_pickup":
      return {
        index: 2,
        label: "On the Way",
        isCancelled: false,
        activeStageLabel: "Ready for Pickup",
        statusDescription: "Order is packed and ready for delivery partner pickup.",
      };
    case "picked_up":
    case "out_for_delivery":
      return {
        index: 2,
        label: "On the Way",
        isCancelled: false,
        activeStageLabel: "Out for Delivery",
        statusDescription: "Delivery partner is on the way to your address.",
      };
    case "delivered":
      return {
        index: 3,
        label: "Arrived",
        isCancelled: false,
        activeStageLabel: "Order Delivered",
        statusDescription: "Order has been delivered. Enjoy your meal!",
      };
    case "cancelled":
    default:
      return {
        index: -1,
        label: "Cancelled",
        isCancelled: true,
        activeStageLabel: "Order Cancelled",
        statusDescription: "This order was cancelled.",
      };
  }
}

/**
 * Returns true if customer is allowed to cancel the order.
 * Cancellation is allowed ONLY when status is "placed" or "accepted".
 */
export function isOrderCancelable(status: string): boolean {
  const normalized = (status || "").toLowerCase();
  return normalized === "placed" || normalized === "accepted";
}

/**
 * Returns true if order has reached a terminal status ("delivered" or "cancelled").
 * Used to automatically stop polling in RTK Query.
 */
export function isTerminalOrderStatus(status: string): boolean {
  const normalized = (status || "").toLowerCase();
  return normalized === "delivered" || normalized === "cancelled";
}
