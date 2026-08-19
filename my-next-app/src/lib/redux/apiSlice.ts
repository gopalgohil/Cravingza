import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Address {
  _id?: string;
  label: "Home" | "Work" | "Other";
  addressLine: string;
  city: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotionalOffers: boolean;
  newRestaurantAlerts: boolean;
}

export interface MenuItem {
  _id: string;
  restaurant: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestSeller: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  isBestSeller?: boolean;
}

export interface OrderItem {
  _id: string;
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  restaurant: string;
  items: OrderItem[];
  deliveryAddress: {
    label: string;
    addressLine: string;
    city: string;
  };
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  totalAmount: number;
  status: "placed" | "accepted" | "preparing" | "ready_for_pickup" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    credentials: "include", // Crucial for sending JWT cookie
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("cravingza_token");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Cart", "Orders", "Restaurants", "Reviews", "User", "Addresses", "Menu", "MerchantOrders", "AdminDashboard", "AdminRestaurants", "AdminUsers", "Delivery", "Notifications", "Offers", "MyApplication", "AdminSettings"],
  endpoints: (builder) => ({
    // Notifications Endpoints
    getNotificationsList: builder.query<any, void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationsRead: builder.mutation<any, { notificationId?: string } | void>({
      query: (body) => ({
        url: "/notifications/read",
        method: "PATCH",
        body: body || {},
      }),
      invalidatesTags: ["Notifications"],
    }),
    clearNotificationsList: builder.mutation<any, void>({
      query: () => ({
        url: "/notifications",
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Cart Endpoints
    getCart: builder.query<any, void>({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation<any, { menuItemId: string; quantity: number }>({
      query: (body) => ({
        url: "/cart/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: builder.mutation<any, { menuItemId: string; quantity: number }>({
      query: (body) => ({
        url: "/cart/update",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),
    removeCartItem: builder.mutation<any, string>({
      query: (menuItemId) => ({
        url: `/cart/remove/${menuItemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: builder.mutation<any, void>({
      query: () => ({
        url: "/cart/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    replaceCart: builder.mutation<any, { menuItemId: string; quantity: number }>({
      query: (body) => ({
        url: "/cart/replace",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),

    // Order Endpoints
    createOrder: builder.mutation<any, { deliveryAddress: { addressLine: string; label?: string; city?: string; phone?: string }; couponCode?: string }>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart", "Orders"],
    }),
    getOrders: builder.query<any, void>({
      query: () => "/orders",
      providesTags: ["Orders"],
    }),
    getOrder: builder.query<any, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Orders", id }],
    }),
    cancelOrder: builder.mutation<any, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Orders"],
    }),

    // Restaurant Endpoints
    getRestaurants: builder.query<any, { cuisine?: string; search?: string; sort?: string }>({
      query: (params) => ({
        url: "/restaurants",
        params,
      }),
      providesTags: ["Restaurants"],
    }),
    getRestaurantById: builder.query<any, string>({
      query: (id) => `/restaurants/${id}`,
      providesTags: (result, error, id) => [{ type: "Restaurants", id }],
    }),

    // Review Endpoints
    createReview: builder.mutation<any, { orderId: string; rating: number; comment?: string }>({
      query: (body) => ({
        url: "/reviews",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Restaurants", "Reviews"],
    }),
    getReviewByOrder: builder.query<any, string>({
      query: (orderId) => `/reviews/order/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: "Reviews", id: orderId }],
    }),
    getMerchantReviews: builder.query<any, void>({
      query: () => "/reviews/merchant",
      providesTags: ["Reviews"],
    }),

    // User Settings Endpoints
    updateProfile: builder.mutation<any, { name: string; phone?: string }>({
      query: (body) => ({
        url: "/user/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    updatePassword: builder.mutation<any, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: "/user/password",
        method: "PATCH",
        body,
      }),
    }),
    getAddresses: builder.query<any, void>({
      query: () => "/user/addresses",
      providesTags: ["Addresses"],
    }),
    addAddress: builder.mutation<any, Omit<Address, "_id">>({
      query: (body) => ({
        url: "/user/addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Addresses"],
    }),
    updateAddress: builder.mutation<any, { addressId: string } & Partial<Address>>({
      query: ({ addressId, ...body }) => ({
        url: `/user/addresses/${addressId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: builder.mutation<any, string>({
      query: (addressId) => ({
        url: `/user/addresses/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Addresses"],
    }),
    updateNotifications: builder.mutation<any, Partial<NotificationPreferences>>({
      query: (body) => ({
        url: "/user/notifications",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    deleteAccount: builder.mutation<any, { confirmText: string }>({
      query: (body) => ({
        url: "/user/account",
        method: "DELETE",
        body,
      }),
    }),
    applyAsPartner: builder.mutation<any, any>({
      query: (body) => ({
        url: "/restaurants/apply",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Restaurants"],
    }),
    getMyApplication: builder.query<any, void>({
      query: () => "/restaurants/my-application",
      providesTags: ["User", "Restaurants"],
    }),
    reapplyAsPartner: builder.mutation<any, any>({
      query: (body) => ({
        url: "/restaurants/reapply",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Restaurants"],
    }),
    applyAsDeliveryPartner: builder.mutation<any, any>({
      query: (body) => ({
        url: "/delivery/apply",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Delivery"],
    }),
    getMyDeliveryApplication: builder.query<any, void>({
      query: () => "/delivery/my-application",
      providesTags: ["User", "Delivery"],
    }),
    reapplyAsDeliveryPartner: builder.mutation<any, any>({
      query: (body) => ({
        url: "/delivery/reapply",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Delivery"],
    }),
    getDeliveryDashboard: builder.query<any, void>({
      query: () => "/delivery/dashboard",
      providesTags: ["Delivery"],
    }),
    updateDeliveryStatus: builder.mutation<any, { isOnline: boolean }>({
      query: (body) => ({
        url: "/delivery/status",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Delivery"],
    }),
    getNearbyOrders: builder.query<any, void>({
      query: () => "/delivery/nearby-orders",
      providesTags: ["Delivery", "Orders"],
    }),
    acceptOrder: builder.mutation<any, string>({
      query: (orderId) => ({
        url: `/delivery/orders/${orderId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Delivery", "Orders"],
    }),
    getActiveDelivery: builder.query<any, void>({
      query: () => "/delivery/active",
      providesTags: ["Delivery"],
    }),
    updateActiveDeliveryStatus: builder.mutation<any, { deliveryId: string; status: string }>({
      query: ({ deliveryId, status }) => ({
        url: `/delivery/active/${deliveryId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Delivery", "Orders"],
    }),
    getDeliveryEarnings: builder.query<any, void>({
      query: () => "/delivery/earnings",
      providesTags: ["Delivery", "Orders"],
    }),
    subscribePush: builder.mutation<any, any>({
      query: (subscription) => ({
        url: "/delivery/push-subscribe",
        method: "POST",
        body: subscription,
      }),
      invalidatesTags: ["Delivery"],
    }),

    // Menu Management Endpoints (Owner)
    getMyMenu: builder.query<MenuItem[], void>({
      query: () => "/restaurants/my-restaurant/menu",
      transformResponse: (response: { success: boolean; data: MenuItem[] }) => response.data,
      providesTags: ["Menu"],
    }),
    addMenuItem: builder.mutation<MenuItem, MenuItemInput>({
      query: (body) => ({
        url: "/restaurants/my-restaurant/menu",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Menu", "Restaurants"],
    }),
    updateMenuItem: builder.mutation<MenuItem, { id: string; data: MenuItemInput }>({
      query: ({ id, data }) => ({
        url: `/restaurants/my-restaurant/menu/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Menu", "Restaurants"],
    }),
    deleteMenuItem: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/restaurants/my-restaurant/menu/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Menu", "Restaurants"],
    }),

    // Merchant Orders Management Endpoints (Owner)
    getMerchantOrders: builder.query<Order[], void>({
      query: () => "/orders/merchant/incoming",
      transformResponse: (response: { success: boolean; data: Order[] }) => response.data,
      providesTags: ["MerchantOrders"],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/orders/merchant/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["MerchantOrders", "Orders"],
    }),

    // Admin Endpoints
    getAdminDashboard: builder.query<any, void>({
      query: () => "/admin/dashboard",
      providesTags: ["AdminDashboard"],
    }),
    getAdminRestaurants: builder.query<any, string>({
      query: (status) => `/admin/restaurants?status=${status}`,
      providesTags: ["AdminRestaurants"],
    }),
    getAdminRestaurantById: builder.query<any, string>({
      query: (id) => `/admin/restaurants/${id}`,
      providesTags: ["AdminRestaurants"],
    }),
    approveRestaurant: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/restaurants/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminRestaurants", "AdminDashboard"],
    }),
    rejectRestaurant: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/restaurants/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["AdminRestaurants", "AdminDashboard"],
    }),
    deactivateRestaurant: builder.mutation<any, { id: string; reason: string; suspendOwner?: boolean }>({
      query: ({ id, reason, suspendOwner }) => ({
        url: `/admin/restaurants/${id}/deactivate`,
        method: "PATCH",
        body: { reason, suspendOwner },
      }),
      invalidatesTags: ["AdminRestaurants", "AdminDashboard", "Restaurants", "User"],
    }),
    reactivateRestaurant: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/restaurants/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminRestaurants", "AdminDashboard", "Restaurants", "User"],
    }),
    getAdminDeliveryProfiles: builder.query<any, string>({
      query: (status) => `/admin/delivery?status=${status}`,
      providesTags: ["Delivery"],
    }),
    getAdminDeliveryProfileById: builder.query<any, string>({
      query: (id) => `/admin/delivery/${id}`,
      providesTags: ["Delivery"],
    }),
    approveDeliveryPartner: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/delivery/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Delivery", "AdminDashboard", "User"],
    }),
    rejectDeliveryPartner: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/delivery/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Delivery", "AdminDashboard"],
    }),
    getAdminUsers: builder.query<any, { role: string; search?: string; status?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: ["AdminUsers"],
    }),
    getAdminUserById: builder.query<any, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminUsers", id }],
    }),
    updateAdminUserStatus: builder.mutation<any, { id: string; status: "active" | "suspended" }>({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    deleteAdminUser: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    updateRestaurantProfile: builder.mutation<any, { name?: string; description?: string; cuisineTags?: string[]; address?: string; coverImageUrl?: string; deliveryTime?: string; deliveryFee?: number }>({
      query: (data) => ({
        url: "/restaurant/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MyApplication", "Restaurants", "AdminRestaurants"],
    }),
    updateBusinessHours: builder.mutation<any, { businessHours: any }>({
      query: (data) => ({
        url: "/restaurant/business-hours",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MyApplication"],
    }),
    updateRestaurantStatus: builder.mutation<any, { isOpen: boolean }>({
      query: (data) => ({
        url: "/restaurant/status",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MyApplication", "Restaurants"],
    }),
    getPayoutDetails: builder.query<{ success: boolean; data: { accountHolderName: string; accountNumber: string; ifscCode: string } }, void>({
      query: () => "/restaurant/payout-details",
      providesTags: ["MyApplication"],
    }),
    updatePayoutDetails: builder.mutation<{ success: boolean; message: string; data: { accountHolderName: string; accountNumber: string; ifscCode: string } }, { accountHolderName: string; accountNumber: string; ifscCode: string }>({
      query: (data) => ({
        url: "/restaurant/payout-details",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MyApplication"],
    }),
    closeRestaurantPermanently: builder.mutation<any, { reason: string }>({
      query: (data) => ({
        url: "/restaurant/close-permanently",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MyApplication", "Restaurants", "AdminRestaurants"],
    }),
    createRazorpayOrder: builder.mutation<{ success: boolean; razorpayOrderId: string; amount: number; currency: string; keyId: string }, { couponCode?: string } | void>({
      query: (data) => ({
        url: "/payment/create-razorpay-order",
        method: "POST",
        body: data || {},
      }),
    }),
    verifyRazorpayPayment: builder.mutation<any, { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; deliveryAddress: any; couponCode?: string }>({
      query: (data) => ({
        url: "/payment/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart", "Orders"],
    }),
    getOffers: builder.query<{ success: boolean; count: number; data: any[] }, void>({
      query: () => "/offers",
      providesTags: ["Offers"],
    }),
    applyCoupon: builder.mutation<any, { code: string }>({
      query: (data) => ({
        url: "/offers/apply",
        method: "POST",
        body: data,
      }),
    }),
    getMerchantOffers: builder.query<{ success: boolean; count: number; data: any[] }, void>({
      query: () => "/offers/merchant",
      providesTags: ["Offers"],
    }),
    createMerchantOffer: builder.mutation<any, any>({
      query: (data) => ({
        url: "/offers/merchant",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Offers"],
    }),
    deleteMerchantOffer: builder.mutation<any, string>({
      query: (id) => ({
        url: `/offers/merchant/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Offers"],
    }),
    getAdminSettings: builder.query<any, void>({
      query: () => "/admin/settings",
      providesTags: ["AdminSettings"],
    }),
    updateAdminSettings: builder.mutation<any, any>({
      query: (body) => ({
        url: "/admin/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminSettings", "AdminDashboard"],
    }),
    getPublicSettings: builder.query<any, void>({
      query: () => "/settings",
      providesTags: ["AdminSettings"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useReplaceCartMutation,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetRestaurantsQuery,
  useGetRestaurantByIdQuery,
  useLazyGetRestaurantByIdQuery,
  useCreateReviewMutation,
  useGetReviewByOrderQuery,
  useGetMerchantReviewsQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useUpdateNotificationsMutation,
  useDeleteAccountMutation,
  useApplyAsPartnerMutation,
  useGetMyApplicationQuery,
  useReapplyAsPartnerMutation,
  useApplyAsDeliveryPartnerMutation,
  useGetMyDeliveryApplicationQuery,
  useReapplyAsDeliveryPartnerMutation,
  useGetDeliveryDashboardQuery,
  useUpdateDeliveryStatusMutation,
  useGetNearbyOrdersQuery,
  useAcceptOrderMutation,
  useGetActiveDeliveryQuery,
  useUpdateActiveDeliveryStatusMutation,
  useSubscribePushMutation,
  useGetDeliveryEarningsQuery,
  useGetAdminDeliveryProfilesQuery,
  useGetAdminDeliveryProfileByIdQuery,
  useApproveDeliveryPartnerMutation,
  useRejectDeliveryPartnerMutation,
  useGetMyMenuQuery,
  useAddMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetMerchantOrdersQuery,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetAdminDashboardQuery,
  useGetAdminRestaurantsQuery,
  useGetAdminRestaurantByIdQuery,
  useApproveRestaurantMutation,
  useRejectRestaurantMutation,
  useDeactivateRestaurantMutation,
  useReactivateRestaurantMutation,
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserStatusMutation,
  useDeleteAdminUserMutation,
  useGetNotificationsListQuery,
  useMarkNotificationsReadMutation,
  useClearNotificationsListMutation,
  useUpdateRestaurantProfileMutation,
  useUpdateBusinessHoursMutation,
  useUpdateRestaurantStatusMutation,
  useGetPayoutDetailsQuery,
  useUpdatePayoutDetailsMutation,
  useCloseRestaurantPermanentlyMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useGetOffersQuery,
  useApplyCouponMutation,
  useGetMerchantOffersQuery,
  useCreateMerchantOfferMutation,
  useDeleteMerchantOfferMutation,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetPublicSettingsQuery,
} = apiSlice;
