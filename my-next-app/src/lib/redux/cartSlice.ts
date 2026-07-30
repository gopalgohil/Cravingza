import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";

export interface CartItem {
  id: string; // matches menuItemId
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  isVeg?: boolean;
}

interface CartState {
  items: CartItem[];
  restaurant: any | null; // Restaurant details or null
  subtotal: number;
  isLoading: boolean;
  conflictModal: {
    open: boolean;
    pendingItem: { menuItemId: string; quantity: number } | null;
    currentRestaurantName: string;
  };
}

const initialState: CartState = {
  items: [],
  restaurant: null,
  subtotal: 0,
  isLoading: false,
  conflictModal: {
    open: false,
    pendingItem: null,
    currentRestaurantName: "",
  },
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartLocal: (state) => {
      state.items = [];
      state.restaurant = null;
      state.subtotal = 0;
      state.isLoading = false;
      state.conflictModal = {
        open: false,
        pendingItem: null,
        currentRestaurantName: "",
      };
    },
    setConflictModal: (
      state,
      action: PayloadAction<{
        open: boolean;
        pendingItem: { menuItemId: string; quantity: number } | null;
        currentRestaurantName: string;
      }>
    ) => {
      state.conflictModal = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Shared fulfilled handler to sync backend responses into Redux state
    const handleCartFulfilled = (state: CartState, action: PayloadAction<any>) => {
      state.isLoading = false;
      const cartData = action.payload?.data || action.payload;
      if (cartData) {
        state.restaurant = cartData.restaurant || null;
        state.subtotal = cartData.subtotal || 0;
        state.items = (cartData.items || []).map((item: any) => ({
          id: item.menuItem?._id || item.menuItem || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.menuItem?.image || "",
          restaurantId: cartData.restaurant?._id || cartData.restaurant || "",
          restaurantName: cartData.restaurant?.name || "",
          isVeg: item.isVeg,
        }));
      }
    };

    builder
      // getCart
      .addMatcher(apiSlice.endpoints.getCart.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(apiSlice.endpoints.getCart.matchFulfilled, handleCartFulfilled)
      .addMatcher(apiSlice.endpoints.getCart.matchRejected, (state) => {
        state.isLoading = false;
      })
      // addToCart
      .addMatcher(apiSlice.endpoints.addToCart.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(apiSlice.endpoints.addToCart.matchFulfilled, handleCartFulfilled)
      .addMatcher(apiSlice.endpoints.addToCart.matchRejected, (state) => {
        state.isLoading = false;
      })
      // updateCartItem
      .addMatcher(apiSlice.endpoints.updateCartItem.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(apiSlice.endpoints.updateCartItem.matchFulfilled, handleCartFulfilled)
      .addMatcher(apiSlice.endpoints.updateCartItem.matchRejected, (state) => {
        state.isLoading = false;
      })
      // removeCartItem
      .addMatcher(apiSlice.endpoints.removeCartItem.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(apiSlice.endpoints.removeCartItem.matchFulfilled, handleCartFulfilled)
      .addMatcher(apiSlice.endpoints.removeCartItem.matchRejected, (state) => {
        state.isLoading = false;
      })
      // clearCart
      .addMatcher(apiSlice.endpoints.clearCart.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(apiSlice.endpoints.clearCart.matchFulfilled, handleCartFulfilled)
      .addMatcher(apiSlice.endpoints.clearCart.matchRejected, (state) => {
        state.isLoading = false;
      })
      // replaceCart
      .addMatcher(apiSlice.endpoints.replaceCart.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(apiSlice.endpoints.replaceCart.matchFulfilled, handleCartFulfilled)
      .addMatcher(apiSlice.endpoints.replaceCart.matchRejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearCartLocal, setConflictModal, setIsLoading } = cartSlice.actions;
export default cartSlice.reducer;
