import restaurantsData from "./data/restaurants.json";
import menuItemsData from "./data/menuItems.json";

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  popular?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  categories: string[];
  priceRange: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  image: string;
  menu: MenuItem[];
}

export const mockRestaurants: Restaurant[] = (restaurantsData as any[]).map((r) => ({
  ...r,
  menu: (menuItemsData as any[])
    .filter((m) => m.restaurantId === r.id)
    .map((m) => ({
      id: m.id,
      restaurantId: m.restaurantId,
      name: m.name,
      price: m.price,
      description: m.description,
      image: m.image,
      popular: m.popular,
    })),
}));

