export type DeliveryStatus =
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface Delivery {
  _id: string;
  order: string;
  deliveryPartner: string;
  status: DeliveryStatus;
  earnings: number;
  distanceKm: number;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveDeliverySummary {
  id: string;
  orderId: string;
  restaurantName: string;
  status: DeliveryStatus;
  customerAddress?: string;
  earnings?: number;
}

export interface DeliveryDashboardData {
  isOnline: boolean;
  earningsToday: number;
  deliveriesCompletedToday: number;
  activeHoursToday: number; // TODO: Real time-tracking future enhancement
  distanceCoveredToday: number;
  averageRating: number | string; // TODO: DeliveryReview model future enhancement
  lifetimeDeliveries: number;
  activeDelivery: ActiveDeliverySummary | null;
}
