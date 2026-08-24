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

export const mockRestaurants: Restaurant[] = [];
