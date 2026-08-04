require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");

const restaurantsData = [
  {
    name: "The Pasta House",
    description: "Authentic handmade Italian pastas and stone-baked pizzas.",
    cuisineTags: ["Italian", "Pasta", "Pizza"],
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    location: { address: "42 Rome Avenue", city: "Metro City", lat: 40.7128, lng: -74.0060 },
    rating: 4.8,
    reviewCount: 320,
    deliveryTime: "20-30 min",
    deliveryFee: 49,
    minOrderAmount: 15,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Truffle Mushroom Penne",
        category: "Pasta",
        description: "Creamy truffle sauce with wild mushrooms and parmesan.",
        price: 215.99,
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Classic Margherita Pizza",
        category: "Pizza",
        description: "Fresh mozzarella, tomato sauce, and basil leaves.",
        price: 229.99,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Spicy Arrabbiata",
        category: "Pasta",
        description: "Fiery tomato sauce with garlic and red chili flakes.",
        price: 243.99,
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Pepperoni Feast Pizza",
        category: "Pizza",
        description: "Double pepperoni and loaded mozzarella cheese.",
        price: 257.99,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Garlic Breadsticks",
        category: "Starters",
        description: "Oven-baked breadsticks brushed with garlic butter.",
        price: 271.99,
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Tiramisu",
        category: "Desserts",
        description: "Classic Italian dessert with espresso-dipped ladyfingers.",
        price: 280.99,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Burger Boss",
    description: "Gourmet smash burgers, truffle fries, and signature milkshakes.",
    cuisineTags: ["Burgers", "Fast Food", "American"],
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    location: { address: "101 Burger Boulevard", city: "Metro City", lat: 40.7250, lng: -74.0100 },
    rating: 4.6,
    reviewCount: 240,
    deliveryTime: "15-25 min",
    deliveryFee: 29,
    minOrderAmount: 10,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Double Cheddar Bacon Smash",
        category: "Burgers",
        description: "Two beef patties, aged cheddar, crispy bacon, and boss sauce.",
        price: 294.99,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Truffle Parmesan Fries",
        category: "Sides",
        description: "Crispy skin-on fries tossed in truffle oil and parmesan.",
        price: 308.99,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Crispy Chicken Slider",
        category: "Burgers",
        description: "Buttermilk fried chicken, spicy mayo, and pickles.",
        price: 322.99,
        image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Sweet Potato Waffle Fries",
        category: "Sides",
        description: "Crispy sweet potato fries served with chipotle dip.",
        price: 336.99,
        image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Classic Vanilla Milkshake",
        category: "Drinks",
        description: "Rich vanilla ice cream topped with whipped cream.",
        price: 345.99,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Onion Rings",
        category: "Sides",
        description: "Beer-battered golden crispy onion rings.",
        price: 359.99,
        image: "https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Sushi Zen",
    description: "Premium sushi rolls, fresh sashimi, and traditional Japanese small plates.",
    cuisineTags: ["Japanese", "Sushi", "Asian"],
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    location: { address: "88 Sakura Lane", city: "Metro City", lat: 40.7300, lng: -74.0010 },
    rating: 4.9,
    reviewCount: 410,
    deliveryTime: "30-40 min",
    deliveryFee: 59,
    minOrderAmount: 20,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Dragon Roll",
        category: "Special Rolls",
        description: "Eel and cucumber inside, avocado and unagi sauce outside.",
        price: 373.99,
        image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Salmon Nigiri",
        category: "Nigiri",
        description: "Fresh premium salmon over seasoned sushi rice (4pcs).",
        price: 387.99,
        image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Spicy Tuna Roll",
        category: "Classic Rolls",
        description: "Spicy tuna, cucumber, and spicy mayo inside.",
        price: 401.99,
        image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Vegetable Tempura",
        category: "Starters",
        description: "Lightly battered crispy broccoli, sweet potato, and zucchini.",
        price: 410.99,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Miso Soup",
        category: "Starters",
        description: "Traditional soybean broth with tofu and seaweed.",
        price: 424.99,
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Matcha Mochi Ice Cream",
        category: "Desserts",
        description: "Japanese green tea ice cream wrapped in sweet rice dough.",
        price: 438.99,
        image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Taco Fiesta",
    description: "Mexican street tacos, giant loaded burritos, and fresh guacamole.",
    cuisineTags: ["Mexican", "Tacos", "Burritos"],
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
    location: { address: "12 Cantina Street", city: "Metro City", lat: 40.7100, lng: -74.0200 },
    rating: 4.5,
    reviewCount: 190,
    deliveryTime: "20-30 min",
    deliveryFee: 0,
    minOrderAmount: 12,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Birria Tacos (3pcs)",
        category: "Tacos",
        description: "Beef braised in chili broth, melted cheese, onions, and cilantro with consommé.",
        price: 452.99,
        image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Loaded Carne Asada Burrito",
        category: "Burritos",
        description: "Grilled steak, rice, beans, sour cream, and salsa wrapped in a warm tortilla.",
        price: 466.99,
        image: "https://images.unsplash.com/photo-1562059390-a761a084768e?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Chipotle Chicken Quesadilla",
        category: "Quesadillas",
        description: "Grilled chicken, smoky chipotle sauce, and melted Monterey Jack cheese.",
        price: 475.99,
        image: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Chips & Fresh Guacamole",
        category: "Starters",
        description: "Crispy house-made tortilla chips served with fresh hand-mashed avocado guacamole.",
        price: 489.99,
        image: "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Churros with Cajeta",
        category: "Desserts",
        description: "Golden fried cinnamon-sugar churros with Mexican caramel dip.",
        price: 503.99,
        image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Horchata",
        category: "Drinks",
        description: "Refreshing traditional rice milk flavored with cinnamon and vanilla.",
        price: 517.99,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Spice Symphony",
    description: "Classic Indian curries, tandoori clay-oven breads, and street snacks.",
    cuisineTags: ["Indian", "Curry", "Vegetarian"],
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
    location: { address: "55 Taj Road", city: "Metro City", lat: 40.7180, lng: -74.0080 },
    rating: 4.7,
    reviewCount: 280,
    deliveryTime: "35-45 min",
    deliveryFee: 39,
    minOrderAmount: 18,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Butter Chicken",
        category: "Curries",
        description: "Tender chicken cooked in a rich, buttery, tomato cream gravy.",
        price: 531.99,
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Paneer Butter Masala",
        category: "Curries",
        description: "Soft cottage cheese cubes cooked in a mildly sweet, aromatic cream sauce.",
        price: 540.99,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Garlic Naan",
        category: "Breads",
        description: "Traditional clay-oven flatbread infused with minced garlic and butter.",
        price: 554.99,
        image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Vegetable Samosa (3pcs)",
        category: "Starters",
        description: "Crispy pastry pockets filled with spiced potato and green peas.",
        price: 568.99,
        image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Chicken Biryani",
        category: "Rice Dishes",
        description: "Aromatic basmati rice layered with spiced chicken and saffron.",
        price: 582.99,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Mango Lassi",
        category: "Drinks",
        description: "Sweet yogurt drink blended with fresh alphanso mango pulp.",
        price: 596.99,
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Wok & Roll",
    description: "Chinese comfort foods, woks, noodle soups, and delicious spring rolls.",
    cuisineTags: ["Chinese", "Noodles", "Asian"],
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop&q=80",
    location: { address: "19 Great Wall Way", city: "Metro City", lat: 40.7140, lng: -74.0040 },
    rating: 4.4,
    reviewCount: 160,
    deliveryTime: "25-35 min",
    deliveryFee: 29,
    minOrderAmount: 12,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "General Tso's Chicken",
        category: "Main Course",
        description: "Crispy sweet and spicy chicken chunks tossed in signature Tso sauce.",
        price: 605.99,
        image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Schezwan Chili Noodles",
        category: "Noodles",
        description: "Stir-fried noodles with crisp veggies and hot Schezwan garlic sauce.",
        price: 619.99,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Steamed Pork Dumplings (6pcs)",
        category: "Starters",
        description: "Delicate wrapper dumplings packed with seasoned minced pork.",
        price: 633.99,
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Veg Spring Rolls (4pcs)",
        category: "Starters",
        description: "Golden fried spring rolls stuffed with shred cabbage and carrots.",
        price: 647.99,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Beef & Broccoli Stir Fry",
        category: "Main Course",
        description: "Tender beef slices with fresh broccoli in savory oyster garlic gravy.",
        price: 661.99,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Sweet & Sour Tofu",
        category: "Main Course",
        description: "Crispy tofu blocks with bell peppers in tangy pineapple sauce.",
        price: 670.99,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Green & Lean",
    description: "Vibrant salad bowls, healthy wraps, and sugar-free protein desserts.",
    cuisineTags: ["Healthy", "Salads", "Vegetarian"],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
    location: { address: "3 Health Circle", city: "Metro City", lat: 40.7200, lng: -74.0150 },
    rating: 4.7,
    reviewCount: 150,
    deliveryTime: "15-25 min",
    deliveryFee: 49,
    minOrderAmount: 15,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Avocado Quinoa Power Bowl",
        category: "Salad Bowls",
        description: "Fresh avocado, quinoa, chickpeas, spinach, cucumber, lemon tahini dressing.",
        price: 684.99,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Grilled Chicken Caesar Salad",
        category: "Salad Bowls",
        description: "Tender grilled breast, crisp romaine lettuce, seasoned croutons, light parmesan Caesar.",
        price: 698.99,
        image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Hummus & Grilled Pita",
        category: "Starters",
        description: "House-made garlic olive oil hummus served with toasted warm pita.",
        price: 712.99,
        image: "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Green Detox Smoothie",
        category: "Drinks",
        description: "Kale, green apple, cucumber, celery, fresh ginger, and coconut water.",
        price: 726.99,
        image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Acai Berry Bowl",
        category: "Desserts",
        description: "Organic acai puree topped with strawberries, blueberries, granola, and honey.",
        price: 735.99,
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Vegan Protein Waffle",
        category: "Desserts",
        description: "Oat-flour waffle topped with plant protein cream and maple syrup.",
        price: 749.99,
        image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Pizza Parlor",
    description: "Authentic Neapolitan wood-fired pizzas, garlic knots, and Italian sodas.",
    cuisineTags: ["Pizza", "Italian", "Fast Food"],
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=80",
    location: { address: "77 Napoli Street", city: "Metro City", lat: 40.7150, lng: -74.0050 },
    rating: 4.9,
    reviewCount: 450,
    deliveryTime: "20-30 min",
    deliveryFee: 0,
    minOrderAmount: 12,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Supreme Loaded Pizza",
        category: "Pizza",
        description: "Pepperoni, Italian sausage, bell peppers, onions, and black olives.",
        price: 299.99,
        image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: true,
      },
      {
        name: "Four Cheese Quattro Formaggi",
        category: "Pizza",
        description: "Mozzarella, Gorgonzola, Parmesan, and Provolone cheese blend.",
        price: 279.99,
        image: "https://images.unsplash.com/photo-1573821663912-569905455b1c?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "BBQ Chicken Pizza",
        category: "Pizza",
        description: "Smoky BBQ sauce, grilled chicken breast, red onions, and cilantro.",
        price: 319.99,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
        isVeg: false,
        isBestSeller: false,
      },
      {
        name: "Stuffed Garlic Knots (6pcs)",
        category: "Starters",
        description: "Fresh dough knots brushed with garlic butter, parsley, and parmesan.",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
    ],
  },
  {
    name: "Jassi De Parathe",
    description: "Authentic Punjabi stuffed parathas with fresh white butter, curd, and spicy mango pickle.",
    cuisineTags: ["Indian", "Punjabi", "Paratha", "Vegetarian", "Curry"],
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
    location: { address: "108 GT Road", city: "Metro City", lat: 40.7190, lng: -74.0070 },
    rating: 4.8,
    reviewCount: 380,
    deliveryTime: "20-30 min",
    deliveryFee: 29,
    minOrderAmount: 99,
    approvalStatus: "approved",
    isOpen: true,
    menu: [
      {
        name: "Amritsari Aloo Paratha (2pcs)",
        category: "Parathas",
        description: "Spiced mashed potato filling inside whole wheat bread, served with Amul white butter and curd.",
        price: 149.00,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Paneer Pyaz Special Paratha",
        category: "Parathas",
        description: "Stuffed with grated cottage cheese, chopped onions, green chilies, and coriander.",
        price: 189.00,
        image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
      {
        name: "Gobhi Stuffed Paratha",
        category: "Parathas",
        description: "Grated cauliflower cooked with Punjabi spices, served with fresh yogurt.",
        price: 159.00,
        image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: false,
      },
      {
        name: "Kulhad Sweet Malai Lassi",
        category: "Drinks",
        description: "Thick creamy Punjabi sweet lassi topped with fresh malai and chopped almonds.",
        price: 99.00,
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
        isVeg: true,
        isBestSeller: true,
      },
    ],
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    // Clear existing
    console.log("Clearing existing restaurants and menu items...");
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("Existing data cleared.");

    const User = require("../models/User");
    const Order = require("../models/Order");

    // SAFEGUARD: Do NOT delete existing real orders placed by users
    const existingOrderCount = await Order.countDocuments();
    if (existingOrderCount > 0) {
      console.log(`Preserving ${existingOrderCount} existing orders in database.`);
    }

    const targetOwner = await User.findOne({ email: "gopalgohel249@gmail.com" });
    if (targetOwner) {
      targetOwner.role = "owner";
      await targetOwner.save();
      console.log(`Updated user ${targetOwner.email} role to 'owner'.`);
    }

    let sampleCustomer = await User.findOne({ role: "customer" });
    if (!sampleCustomer) {
      sampleCustomer = targetOwner || (await User.findOne({}));
    }

    for (const rData of restaurantsData) {
      const { menu, ...restDetails } = rData;
      
      // Link Burger Boss to gopalgohel249@gmail.com if found
      if (restDetails.name === "Burger Boss" && targetOwner) {
        restDetails.owner = targetOwner._id;
      }

      // Ensure demo documents are attached if missing
      if (!restDetails.documents) {
        restDetails.documents = {
          fssaiLicense: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
          businessRegistration: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
        };
      }

      // Save restaurant
      const restaurant = new Restaurant(restDetails);
      await restaurant.save();
      console.log(`Seeded Restaurant: ${restaurant.name}${restDetails.owner ? " (Owner Linked)" : ""}`);

      // Save menu items
      const createdMenuItems = [];
      for (const mItem of menu) {
        const menuItem = new MenuItem({
          ...mItem,
          restaurant: restaurant._id,
        });
        await menuItem.save();
        createdMenuItems.push(menuItem);
      }
      console.log(`  Seeded ${menu.length} menu items.`);

      // Seed 12 comprehensive sample orders for this restaurant across all statuses & dates
      if (sampleCustomer && createdMenuItems.length > 0) {
        const m1 = createdMenuItems[0];
        const m2 = createdMenuItems[1] || createdMenuItems[0];
        const m3 = createdMenuItems[2] || createdMenuItems[0];

        const sampleOrdersData = [
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [
              { menuItem: m1._id, name: m1.name, price: m1.price, quantity: 2 },
              { menuItem: m2._id, name: m2.name, price: m2.price, quantity: 1 },
            ],
            deliveryAddress: { label: "Home", addressLine: "45 MG Road, Suite 302", city: "Metro City", phone: "9876543210" },
            paymentMethod: "cod", paymentStatus: "pending",
            subtotal: Math.round((m1.price * 2 + m2.price) * 100) / 100,
            deliveryFee: 30, taxes: 15,
            totalAmount: Math.round((m1.price * 2 + m2.price + 45) * 100) / 100,
            status: "placed", createdAt: new Date(Date.now() - 120000), // 2 mins ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [
              { menuItem: m3._id, name: m3.name, price: m3.price, quantity: 1 },
              { menuItem: m1._id, name: m1.name, price: m1.price, quantity: 1 },
            ],
            deliveryAddress: { label: "Work", addressLine: "Building C, Cyber City", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round((m3.price + m1.price) * 100) / 100,
            deliveryFee: 25, taxes: 12,
            totalAmount: Math.round((m3.price + m1.price + 37) * 100) / 100,
            status: "placed", createdAt: new Date(Date.now() - 600000), // 10 mins ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m1._id, name: m1.name, price: m1.price, quantity: 1 }],
            deliveryAddress: { label: "Work", addressLine: "Tech Park, Building B", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round(m1.price * 100) / 100,
            deliveryFee: 30, taxes: 10,
            totalAmount: Math.round((m1.price + 40) * 100) / 100,
            status: "accepted", createdAt: new Date(Date.now() - 1500000), // 25 mins ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m2._id, name: m2.name, price: m2.price, quantity: 2 }],
            deliveryAddress: { label: "Home", addressLine: "88 Orchid Towers", city: "Metro City", phone: "9876543210" },
            paymentMethod: "cod", paymentStatus: "pending",
            subtotal: Math.round((m2.price * 2) * 100) / 100,
            deliveryFee: 30, taxes: 18,
            totalAmount: Math.round((m2.price * 2 + 48) * 100) / 100,
            status: "preparing", createdAt: new Date(Date.now() - 2100000), // 35 mins ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m3._id, name: m3.name, price: m3.price, quantity: 3 }],
            deliveryAddress: { label: "Home", addressLine: "14 Palm Avenue", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round((m3.price * 3) * 100) / 100,
            deliveryFee: 0, taxes: 25,
            totalAmount: Math.round((m3.price * 3 + 25) * 100) / 100,
            status: "ready_for_pickup", createdAt: new Date(Date.now() - 2700000), // 45 mins ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [
              { menuItem: m1._id, name: m1.name, price: m1.price, quantity: 1 },
              { menuItem: m2._id, name: m2.name, price: m2.price, quantity: 2 },
            ],
            deliveryAddress: { label: "Work", addressLine: "DLF Cyber Hub", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round((m1.price + m2.price * 2) * 100) / 100,
            deliveryFee: 30, taxes: 22,
            totalAmount: Math.round((m1.price + m2.price * 2 + 52) * 100) / 100,
            status: "out_for_delivery", createdAt: new Date(Date.now() - 3300000), // 55 mins ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m2._id, name: m2.name, price: m2.price, quantity: 2 }],
            deliveryAddress: { label: "Home", addressLine: "12 Park Avenue", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round((m2.price * 2) * 100) / 100,
            deliveryFee: 0, taxes: 20,
            totalAmount: Math.round((m2.price * 2 + 20) * 100) / 100,
            status: "delivered", createdAt: new Date(Date.now() - 7200000), // 2 hours ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [
              { menuItem: m1._id, name: m1.name, price: m1.price, quantity: 2 },
              { menuItem: m3._id, name: m3.name, price: m3.price, quantity: 1 },
            ],
            deliveryAddress: { label: "Home", addressLine: "77 Heritage Residency", city: "Metro City", phone: "9876543210" },
            paymentMethod: "cod", paymentStatus: "paid",
            subtotal: Math.round((m1.price * 2 + m3.price) * 100) / 100,
            deliveryFee: 40, taxes: 30,
            totalAmount: Math.round((m1.price * 2 + m3.price + 70) * 100) / 100,
            status: "delivered", createdAt: new Date(Date.now() - 18000000), // 5 hours ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m1._id, name: m1.name, price: m1.price, quantity: 3 }],
            deliveryAddress: { label: "Work", addressLine: "Block A Sector 62", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round((m1.price * 3) * 100) / 100,
            deliveryFee: 20, taxes: 25,
            totalAmount: Math.round((m1.price * 3 + 45) * 100) / 100,
            status: "delivered", createdAt: new Date(Date.now() - 86400000), // Yesterday
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m2._id, name: m2.name, price: m2.price, quantity: 1 }],
            deliveryAddress: { label: "Home", addressLine: "302 Green Park", city: "Metro City", phone: "9876543210" },
            paymentMethod: "cod", paymentStatus: "paid",
            subtotal: Math.round(m2.price * 100) / 100,
            deliveryFee: 30, taxes: 10,
            totalAmount: Math.round((m2.price + 40) * 100) / 100,
            status: "delivered", createdAt: new Date(Date.now() - 172800000), // 2 days ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [
              { menuItem: m2._id, name: m2.name, price: m2.price, quantity: 2 },
              { menuItem: m3._id, name: m3.name, price: m3.price, quantity: 2 },
            ],
            deliveryAddress: { label: "Home", addressLine: "19 Sunrise Villa", city: "Metro City", phone: "9876543210" },
            paymentMethod: "razorpay", paymentStatus: "paid",
            subtotal: Math.round((m2.price * 2 + m3.price * 2) * 100) / 100,
            deliveryFee: 0, taxes: 40,
            totalAmount: Math.round((m2.price * 2 + m3.price * 2 + 40) * 100) / 100,
            status: "delivered", createdAt: new Date(Date.now() - 259200000), // 3 days ago
          },
          {
            customer: sampleCustomer._id,
            restaurant: restaurant._id,
            items: [{ menuItem: m1._id, name: m1.name, price: m1.price, quantity: 1 }],
            deliveryAddress: { label: "Work", addressLine: "Unit 501 Infotech", city: "Metro City", phone: "9876543210" },
            paymentMethod: "cod", paymentStatus: "pending",
            subtotal: Math.round(m1.price * 100) / 100,
            deliveryFee: 30, taxes: 10,
            totalAmount: Math.round((m1.price + 40) * 100) / 100,
            status: "cancelled", cancellationReason: "Customer requested cancellation before restaurant acceptance.",
            createdAt: new Date(Date.now() - 345600000), // 4 days ago
          },
        ];

        for (const oData of sampleOrdersData) {
          await Order.create(oData);
        }
        console.log(`  Seeded 12 comprehensive sample orders for ${restaurant.name}.`);
      }
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
