import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Order {
  restaurantId: string;
  restaurantName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  total: number;
  address: string;
  status: "placed" | "preparing" | "delivering" | "delivered";
  eta: string;
  placedAt: string;
}

interface AppState {
  cart: CartItem[];
  address: string;
  setAddress: (address: string) => void;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
  authChecked: boolean;
  setAuthChecked: (checked: boolean) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  cart: [],
  address: "123 Main Street, City Centre",
  setAddress: (address) => set({ address }),
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((i) => i.id === item.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),
  removeFromCart: (itemId) =>
    set((state) => {
      const existing = state.cart.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return {
          cart: state.cart.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }
      return { cart: state.cart.filter((i) => i.id !== itemId) };
    }),
  clearCart: () => set({ cart: [] }),
  user: null,
  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("cravingza_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("cravingza_user");
        localStorage.removeItem("cravingza_application_status");
        localStorage.removeItem("cravingza_restaurant_name");
      }
    }
    set({ user });
  },
  authChecked: false,
  setAuthChecked: (authChecked) => set({ authChecked }),
  activeOrder: null,
  setActiveOrder: (activeOrder) => set({ activeOrder }),
}));

