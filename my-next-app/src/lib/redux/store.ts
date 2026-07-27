import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import { apiSlice } from "./apiSlice";

const loadState = () => {
  try {
    if (typeof window === "undefined") return undefined;
    const serializedState = localStorage.getItem("cravingza_cart");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("cravingza_cart", serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  preloadedState: preloadedState ? { cart: preloadedState } : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

store.subscribe(() => {
  saveState(store.getState().cart);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
