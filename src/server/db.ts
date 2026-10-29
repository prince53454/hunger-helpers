import fs from 'fs';
import path from 'path';
import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  CreateOrderPayload,
  OrderItem,
  AnalyticsSummary,
  SubmitRatingPayload,
  OrderRating,
  RecentFeedbackEntry,
} from '../types/restaurant.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'restaurant-db.json');

interface DatabaseSchema {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  lastOrderNumber: number;
}

// Default Seed Data
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'starters',
    name: 'Small Plates & Starters',
    description: 'Freshly prepared starters and sharing bites',
    icon: 'Salad',
    sortOrder: 1,
  },
  {
    id: 'mains',
    name: 'Mains & Signatures',
    description: 'Handcrafted pasta, wood-fired mains & chef specialties',
    icon: 'UtensilsCrossed',
    sortOrder: 2,
  },
  {
    id: 'pizza-burgers',
    name: 'Artisan Pizzas & Burgers',
    description: 'Slow-fermented dough pizzas and brioche wagyu burgers',
    icon: 'Pizza',
    sortOrder: 3,
  },
  {
    id: 'desserts',
    name: 'Desserts & Sweets',
    description: 'House-made patisserie and seasonal desserts',
    icon: 'IceCream2',
    sortOrder: 4,
  },
  {
    id: 'beverages',
    name: 'Drinks & Refreshments',
    description: 'Craft mocktails, artisanal sodas, wine & coffee',
    icon: 'Coffee',
    sortOrder: 5,
  },
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'truffle-pappardelle',
    categoryId: 'mains',
    name: 'Truffle Pappardelle',
    description: 'Handmade wide ribbon pasta, shaved black Umbrian truffles, 24-month aged parmesan cream & wild thyme microgreens.',
    basePrice: 18.00,
    image: '/src/assets/images/dish_truffle_pasta_1793287332343.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 14,
    popular: true,
    variants: [
      { id: 'half', name: 'Half Plate (Tasting)', price: 16.00 },
      { id: 'full', name: 'Full Plate (Entrée)', price: 26.50 },
    ],
  },
  {
    id: 'woodfired-margherita',
    categoryId: 'pizza-burgers',
    name: 'Wood-Fired Margherita',
    description: 'San Marzano D.O.P. tomato sauce, fresh buffalo mozzarella, aromatic sweet basil & extra virgin olive oil on blistered leopard crust.',
    basePrice: 16.00,
    image: '/src/assets/images/dish_woodfired_pizza_1793287333703.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 12,
    popular: true,
    variants: [
      { id: 'regular', name: '10" Personal (6 Slices)', price: 15.50 },
      { id: 'large', name: '14" Sharing (8 Slices)', price: 22.00 },
    ],
  },
  {
    id: 'wagyu-smash-burger',
    categoryId: 'pizza-burgers',
    name: 'Brioche Wagyu Smash Burger',
    description: 'Double seared wagyu beef patties, sharp melted cave cheddar, crispy shallots, house dill pickles and smoky truffle aioli on toasted potato brioche.',
    basePrice: 17.50,
    image: '/src/assets/images/dish_wagyu_burger_1793287333993.jpg',
    isAvailable: true,
    dietary: ['non-veg'],
    prepTimeMinutes: 15,
    popular: true,
    variants: [
      { id: 'single', name: 'Single Patty (Classic)', price: 17.50 },
      { id: 'double', name: 'Double Patty (Signature)', price: 23.00 },
    ],
  },
  {
    id: 'espresso-berry-tiramisu',
    categoryId: 'desserts',
    name: 'Espresso Berry Tiramisu',
    description: 'Single-origin espresso soaked savoiardi biscuits, whipped mascarpone cream, Dutch cocoa dusting, served with fresh raspberries and garden mint.',
    basePrice: 11.00,
    image: '/src/assets/images/dish_berry_tiramisu_1793287334194.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 6,
    popular: true,
    variants: [
      { id: 'single', name: 'Single Portion', price: 11.00 },
      { id: 'duo', name: 'Duo Sharing Board', price: 19.00 },
    ],
  },
  {
    id: 'crispy-calamari',
    categoryId: 'starters',
    name: 'Salt & Pepper Monterey Calamari',
    description: 'Flash-fried tender squid tossed with roasted garlic crumbs, scallions, smoked chili flakes and charred lemon aioli.',
    basePrice: 14.00,
    image: '/images/crispy-calamari.webp',
    isAvailable: true,
    dietary: ['non-veg', 'spicy'],
    prepTimeMinutes: 10,
    popular: false,
    variants: [
      { id: 'half', name: 'Half Basket', price: 10.50 },
      { id: 'full', name: 'Full Basket', price: 16.50 },
    ],
  },
  {
    id: 'burrata-caprese',
    categoryId: 'starters',
    name: 'Pugliese Burrata & Heirloom Tomatoes',
    description: 'Creamy burrata heart, marinated heirloom cherry tomatoes, cold-pressed basil oil, aged balsamic glaze and grilled sourdough crostini.',
    basePrice: 15.00,
    image: '/images/burrata-caprese.jpg',
    isAvailable: true,
    dietary: ['veg', 'gluten-free'],
    prepTimeMinutes: 8,
    popular: true,
    variants: [
      { id: 'regular', name: 'Standard Plate', price: 15.00 },
    ],
  },
  {
    id: 'wild-mushroom-risotto',
    categoryId: 'mains',
    name: 'Acquerello Wild Mushroom Risotto',
    description: 'Carnaroli aged rice slowly simmered with chanterelles, porcini broth, cold churned butter, pecorino romano and crispy sage.',
    basePrice: 21.00,
    image: '/images/wild-mushroom-risotto.webp',
    isAvailable: true,
    dietary: ['veg', 'gluten-free'],
    prepTimeMinutes: 18,
    popular: false,
    variants: [
      { id: 'half', name: 'Half Plate', price: 14.50 },
      { id: 'full', name: 'Full Plate', price: 23.50 },
    ],
  },
  {
    id: 'hibiscus-mint-cooler',
    categoryId: 'beverages',
    name: 'Sparkling Hibiscus Mint Cooler',
    description: 'Organic steeped hibiscus petals, fresh crushed spearmint, Key lime juice, cane syrup and sparkling mineral water over crushed ice.',
    basePrice: 7.00,
    image: '/images/hibiscus-mint-cooler.jpg',
    isAvailable: true,
    dietary: ['vegan'],
    prepTimeMinutes: 4,
    popular: true,
    variants: [
      { id: 'glass', name: 'Glass (12 oz)', price: 7.00 },
      { id: 'pitcher', name: 'Sharing Carafe (32 oz)', price: 16.00 },
    ],
  },
  {
    id: 'cold-brew-tonic',
    categoryId: 'beverages',
    name: 'Citrus Cold Brew & Elderflower Tonic',
    description: '24-hour slow steep Ethiopian cold brew layered over botanical elderflower tonic and expressed orange peel.',
    basePrice: 6.50,
    image: '/images/cold-brew-tonic.jpg',
    isAvailable: true,
    dietary: ['vegan'],
    prepTimeMinutes: 3,
    popular: false,
    variants: [
      { id: 'regular', name: 'Regular Glass', price: 6.50 },
    ],
  },
  {
    id: 'tomato-basil-bruschetta',
    categoryId: 'starters',
    name: 'Tomato & Basil Bruschetta',
    description: 'Toasted sourdough topped with ripe tomatoes, fresh basil, garlic, and extra-virgin olive oil.',
    basePrice: 10.00,
    image: '/images/tomato-bruschetta.jpg',
    isAvailable: true,
    dietary: ['vegan'],
    prepTimeMinutes: 7,
    popular: true,
    variants: [
      { id: 'three-pieces', name: '3 Pieces', price: 10.00 },
      { id: 'six-pieces', name: '6 Pieces', price: 18.00 },
    ],
  },
  {
    id: 'lemon-herb-salmon',
    categoryId: 'mains',
    name: 'Lemon Herb Grilled Salmon',
    description: 'Grilled salmon with lemon, garden herbs, seasonal vegetables, and creamy potato purée.',
    basePrice: 25.00,
    image: '/images/lemon-herb-salmon.jpg',
    isAvailable: true,
    dietary: ['non-veg', 'gluten-free'],
    prepTimeMinutes: 19,
    popular: true,
    variants: [
      { id: 'regular', name: 'Regular Fillet', price: 25.00 },
      { id: 'large', name: 'Large Fillet', price: 32.00 },
    ],
  },
  {
    id: 'roasted-vegetable-flatbread',
    categoryId: 'pizza-burgers',
    name: 'Roasted Garden Flatbread',
    description: 'Crisp flatbread with roasted seasonal vegetables, mozzarella, basil, and balsamic glaze.',
    basePrice: 15.00,
    image: '/images/roasted-vegetable-flatbread.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 12,
    popular: false,
    variants: [
      { id: 'personal', name: 'Personal', price: 15.00 },
      { id: 'sharing', name: 'Sharing', price: 22.00 },
    ],
  },
  {
    id: 'chocolate-lava-cake',
    categoryId: 'desserts',
    name: 'Warm Chocolate Lava Cake',
    description: 'Warm dark chocolate cake with a molten center, vanilla ice cream, and berry coulis.',
    basePrice: 12.00,
    image: '/images/chocolate-lava-cake.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 8,
    popular: true,
    variants: [
      { id: 'single', name: 'Single Cake', price: 12.00 },
      { id: 'two-cakes', name: 'Two Cakes', price: 21.00 },
    ],
  },
  {
    id: 'sparkling-lemonade',
    categoryId: 'beverages',
    name: 'Sparkling Lemon & Mintade',
    description: 'Fresh lemon juice, sparkling water, garden mint, and a touch of cane sugar.',
    basePrice: 6.00,
    image: '/images/sparkling-lemonade.jpg',
    isAvailable: true,
    dietary: ['vegan', 'gluten-free'],
    prepTimeMinutes: 3,
    popular: false,
    variants: [
      { id: 'glass', name: 'Glass (12 oz)', price: 6.00 },
      { id: 'pitcher', name: 'Pitcher (32 oz)', price: 15.00 },
    ],
  },
  {
    id: 'crispy-arancini',
    categoryId: 'starters',
    name: 'Crispy Mozzarella Arancini',
    description: 'Golden risotto bites filled with mozzarella, served with slow-cooked tomato dip and basil.',
    basePrice: 11.00,
    image: '/images/arancini.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 9,
    popular: false,
    variants: [
      { id: 'four-pieces', name: '4 Pieces', price: 11.00 },
      { id: 'six-pieces', name: '6 Pieces', price: 15.00 },
    ],
  },
  {
    id: 'caprese-salad',
    categoryId: 'starters',
    name: 'Burrata Caprese Salad',
    description: 'Creamy burrata with ripe tomatoes, basil leaves, aged balsamic, and olive oil.',
    basePrice: 14.00,
    image: '/images/caprese-salad.jpg',
    isAvailable: true,
    dietary: ['veg', 'gluten-free'],
    prepTimeMinutes: 7,
    popular: false,
    variants: [
      { id: 'individual', name: 'Individual Plate', price: 14.00 },
      { id: 'sharing', name: 'Sharing Plate', price: 21.00 },
    ],
  },
  {
    id: 'chicken-parmesan',
    categoryId: 'mains',
    name: 'Chicken Parmesan & Fettuccine',
    description: 'Crispy chicken, melted mozzarella, tomato sauce, parmesan, and fresh fettuccine.',
    basePrice: 22.00,
    image: '/images/chicken-parmesan.jpg',
    isAvailable: true,
    dietary: ['non-veg'],
    prepTimeMinutes: 18,
    popular: false,
    variants: [
      { id: 'regular', name: 'Regular', price: 22.00 },
      { id: 'large', name: 'Large', price: 28.00 },
    ],
  },
  {
    id: 'shrimp-scampi',
    categoryId: 'mains',
    name: 'Garlic Butter Shrimp Scampi',
    description: 'Sautéed shrimp with garlic, lemon, parsley, and linguine in a light butter sauce.',
    basePrice: 24.00,
    image: '/images/shrimp-scampi.jpg',
    isAvailable: true,
    dietary: ['non-veg'],
    prepTimeMinutes: 16,
    popular: false,
    variants: [
      { id: 'regular', name: 'Regular', price: 24.00 },
      { id: 'large', name: 'Large', price: 30.00 },
    ],
  },
  {
    id: 'pepperoni-pizza',
    categoryId: 'pizza-burgers',
    name: 'Wood-Fired Pepperoni Pizza',
    description: 'Blistered sourdough crust topped with tomato, mozzarella, and spicy pepperoni.',
    basePrice: 17.00,
    image: '/images/pepperoni-pizza.jpg',
    isAvailable: true,
    dietary: ['non-veg', 'spicy'],
    prepTimeMinutes: 13,
    popular: true,
    variants: [
      { id: 'personal', name: '10-inch Personal', price: 17.00 },
      { id: 'sharing', name: '14-inch Sharing', price: 24.00 },
    ],
  },
  {
    id: 'mushroom-swiss-burger',
    categoryId: 'pizza-burgers',
    name: 'Mushroom Swiss Bistro Burger',
    description: 'Grilled beef patty with Swiss cheese, sautéed mushrooms, and garlic aioli on brioche.',
    basePrice: 18.00,
    image: '/images/mushroom-swiss-burger.jpg',
    isAvailable: true,
    dietary: ['non-veg'],
    prepTimeMinutes: 15,
    popular: false,
    variants: [
      { id: 'single', name: 'Single Patty', price: 18.00 },
      { id: 'double', name: 'Double Patty', price: 24.00 },
    ],
  },
  {
    id: 'vanilla-panna-cotta',
    categoryId: 'desserts',
    name: 'Vanilla Bean Panna Cotta',
    description: 'Silky vanilla bean cream topped with seasonal berry compote.',
    basePrice: 10.00,
    image: '/images/panna-cotta.jpg',
    isAvailable: true,
    dietary: ['veg', 'gluten-free'],
    prepTimeMinutes: 4,
    popular: false,
    variants: [
      { id: 'single', name: 'Single Serving', price: 10.00 },
      { id: 'duo', name: 'Duo Serving', price: 18.00 },
    ],
  },
  {
    id: 'lemon-meringue-tart',
    categoryId: 'desserts',
    name: 'Lemon Meringue Tart',
    description: 'Buttery pastry filled with bright lemon curd and toasted meringue.',
    basePrice: 9.00,
    image: '/images/lemon-tart.jpg',
    isAvailable: true,
    dietary: ['veg'],
    prepTimeMinutes: 4,
    popular: false,
    variants: [
      { id: 'slice', name: 'Single Slice', price: 9.00 },
      { id: 'whole', name: 'Whole Tart (6 slices)', price: 38.00 },
    ],
  },
  {
    id: 'iced-matcha-latte',
    categoryId: 'beverages',
    name: 'Iced Matcha Latte',
    description: 'Stone-ground Japanese matcha whisked with chilled milk over ice.',
    basePrice: 6.50,
    image: '/images/iced-matcha.jpg',
    isAvailable: true,
    dietary: ['veg', 'gluten-free'],
    prepTimeMinutes: 4,
    popular: false,
    variants: [
      { id: 'regular', name: 'Regular (12 oz)', price: 6.50 },
      { id: 'large', name: 'Large (16 oz)', price: 8.00 },
    ],
  },
  {
    id: 'mango-smoothie',
    categoryId: 'beverages',
    name: 'Fresh Mango Smoothie',
    description: 'Ripe mango blended until smooth with yogurt and a splash of citrus.',
    basePrice: 7.00,
    image: '/images/mango-smoothie.jpg',
    isAvailable: true,
    dietary: ['veg', 'gluten-free'],
    prepTimeMinutes: 4,
    popular: false,
    variants: [
      { id: 'regular', name: 'Regular (12 oz)', price: 7.00 },
      { id: 'large', name: 'Large (16 oz)', price: 9.00 },
    ],
  },
];

// Helper to generate seed demo orders for today
function getInitialSeedOrders(): Order[] {
  const now = new Date();
  
  // Order 1: Placed 18 minutes ago (to immediately test the > 15 minute kitchen highlight & alert!)
  const tMinus18 = new Date(now.getTime() - 18 * 60 * 1000).toISOString();
  // Order 2: Placed 7 minutes ago
  const tMinus7 = new Date(now.getTime() - 7 * 60 * 1000).toISOString();
  // Order 3: Placed 2 minutes ago
  const tMinus2 = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
  // Order 4: Ready for pickup (placed 12 minutes ago)
  const tMinus12 = new Date(now.getTime() - 12 * 60 * 1000).toISOString();
  // Order 5: Served earlier today
  const tMinus45 = new Date(now.getTime() - 45 * 60 * 1000).toISOString();

  return [
    {
      id: 'order-seed-101',
      orderNumber: 101,
      orderType: 'dine_in',
      tableNumber: 4,
      customerId: 'cust-1',
      customerName: 'Sandy Jaiswal',
      customerEmail: 'sandy@example.com',
      customerPhone: '+1 (555) 019-2834',
      notes: 'Please hold the cilantro on starters. Dressing on the side.',
      items: [
        {
          itemId: 'truffle-pappardelle',
          name: 'Truffle Pappardelle',
          variantId: 'full',
          variantName: 'Full Plate (Entrée)',
          unitPrice: 26.50,
          quantity: 2,
          itemTotal: 53.00,
          notes: 'Extra parmesan on top please',
        },
        {
          itemId: 'hibiscus-mint-cooler',
          name: 'Sparkling Hibiscus Mint Cooler',
          variantId: 'glass',
          variantName: 'Glass (12 oz)',
          unitPrice: 7.00,
          quantity: 2,
          itemTotal: 14.00,
        },
      ],
      subtotal: 67.00,
      tax: 3.35,
      totalAmount: 70.35,
      status: 'received', // > 15 min waiting! Triggers kitchen warning highlight
      statusHistory: [
        { status: 'received', timestamp: tMinus18, note: 'Order sent by customer at Table 4' },
      ],
      createdAt: tMinus18,
      updatedAt: tMinus18,
    },
    {
      id: 'order-seed-102',
      orderNumber: 102,
      orderType: 'dine_in',
      tableNumber: 7,
      items: [
        {
          itemId: 'woodfired-margherita',
          name: 'Wood-Fired Margherita',
          variantId: 'large',
          variantName: '14" Sharing (8 Slices)',
          unitPrice: 22.00,
          quantity: 1,
          itemTotal: 22.00,
        },
        {
          itemId: 'crispy-calamari',
          name: 'Salt & Pepper Monterey Calamari',
          variantId: 'full',
          variantName: 'Full Basket',
          unitPrice: 16.50,
          quantity: 1,
          itemTotal: 16.50,
        },
      ],
      subtotal: 38.50,
      tax: 1.93,
      totalAmount: 40.43,
      status: 'preparing',
      statusHistory: [
        { status: 'received', timestamp: tMinus7, note: 'Order received' },
        { status: 'preparing', timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), note: 'Chef started pizza oven prep' },
      ],
      createdAt: tMinus7,
      updatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'order-seed-103',
      orderNumber: 103,
      orderType: 'takeaway',
      customerId: 'cust-2',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus@example.com',
      customerPhone: '+1 (555) 234-8901',
      items: [
        {
          itemId: 'wagyu-smash-burger',
          name: 'Brioche Wagyu Smash Burger',
          variantId: 'double',
          variantName: 'Double Patty (Signature)',
          unitPrice: 23.00,
          quantity: 1,
          itemTotal: 23.00,
          notes: 'Medium rare, extra pickles',
        },
        {
          itemId: 'espresso-berry-tiramisu',
          name: 'Espresso Berry Tiramisu',
          variantId: 'single',
          variantName: 'Single Portion',
          unitPrice: 11.00,
          quantity: 1,
          itemTotal: 11.00,
        },
      ],
      subtotal: 34.00,
      tax: 1.70,
      totalAmount: 35.70,
      status: 'ready',
      statusHistory: [
        { status: 'received', timestamp: tMinus12, note: 'Takeaway placed online' },
        { status: 'preparing', timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), note: 'Preparing packaging' },
        { status: 'ready', timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(), note: 'Ready at front pickup counter' },
      ],
      createdAt: tMinus12,
      updatedAt: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
    },
    {
      id: 'order-seed-104',
      orderNumber: 104,
      orderType: 'dine_in',
      tableNumber: 2,
      items: [
        {
          itemId: 'truffle-pappardelle',
          name: 'Truffle Pappardelle',
          variantId: 'half',
          variantName: 'Half Plate (Tasting)',
          unitPrice: 16.00,
          quantity: 1,
          itemTotal: 16.00,
        },
      ],
      subtotal: 16.00,
      tax: 0.80,
      totalAmount: 16.80,
      status: 'received',
      statusHistory: [
        { status: 'received', timestamp: tMinus2, note: 'New order placed' },
      ],
      createdAt: tMinus2,
      updatedAt: tMinus2,
    },
    {
      id: 'order-seed-100',
      orderNumber: 100,
      orderType: 'dine_in',
      tableNumber: 5,
      customerId: 'cust-1',
      customerName: 'Sandy Jaiswal',
      customerEmail: 'sandy@example.com',
      customerPhone: '+1 (555) 019-2834',
      items: [
        {
          itemId: 'burrata-caprese',
          name: 'Pugliese Burrata & Heirloom Tomatoes',
          variantId: 'regular',
          variantName: 'Standard Plate',
          unitPrice: 15.00,
          quantity: 1,
          itemTotal: 15.00,
        },
        {
          itemId: 'wild-mushroom-risotto',
          name: 'Acquerello Wild Mushroom Risotto',
          variantId: 'full',
          variantName: 'Full Plate',
          unitPrice: 23.50,
          quantity: 1,
          itemTotal: 23.50,
        },
      ],
      subtotal: 38.50,
      tax: 1.93,
      totalAmount: 40.43,
      status: 'served',
      rating: {
        rating: 5,
        aspects: ['🔥 Piping Hot', '🍽️ Great Presentation', '⚡ Fast Service'],
        comment: 'The Truffle Pappardelle and Burrata were extraordinary! Served promptly and beautifully.',
        itemRatings: {
          'burrata-caprese': 'loved',
          'wild-mushroom-risotto': 'loved',
        },
        createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      },
      statusHistory: [
        { status: 'received', timestamp: tMinus45, note: 'Initial dine-in order' },
        { status: 'preparing', timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(), note: 'Kitchen started' },
        { status: 'ready', timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), note: 'Plated and ready' },
        { status: 'served', timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), note: 'Served to table 5' },
      ],
      createdAt: tMinus45,
      updatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
  ];
}

class RestaurantDatabase {
  private data: DatabaseSchema;
  private sseClients: Set<(event: string) => void> = new Set();

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.menuItems) && Array.isArray(parsed.orders)) {
          // Keep seeded dish images aligned with their explicit local photo assignments.
          for (const item of parsed.menuItems as MenuItem[]) {
            const seededItem = DEFAULT_MENU_ITEMS.find((seed) => seed.id === item.id);
            if (!seededItem) continue;
            if (item.image !== seededItem.image) item.image = seededItem.image;
            if (!Array.isArray(item.variants) || item.variants.length === 0) item.variants = seededItem.variants;
          }
          const existingItemIds = new Set((parsed.menuItems as MenuItem[]).map((item) => item.id));
          parsed.menuItems.push(...DEFAULT_MENU_ITEMS.filter((item) => !existingItemIds.has(item.id)));
          this.persist(parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load existing database file, initializing fresh:', err);
    }

    const initial: DatabaseSchema = {
      categories: DEFAULT_CATEGORIES,
      menuItems: DEFAULT_MENU_ITEMS,
      orders: getInitialSeedOrders(),
      lastOrderNumber: 104,
    };
    this.persist(initial);
    return initial;
  }

  private persist(dataToSave: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // --- Real-time SSE Broadcaster ---
  public subscribeSSE(sendFn: (event: string) => void): () => void {
    this.sseClients.add(sendFn);
    return () => {
      this.sseClients.delete(sendFn);
    };
  }

  public broadcast(type: string, data: any): void {
    const payload = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    const message = `data: ${payload}\n\n`;
    for (const client of this.sseClients) {
      try {
        client(message);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  // --- Menu Queries & Mutations ---
  public getMenu(): { categories: Category[]; items: MenuItem[] } {
    return {
      categories: [...this.data.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      items: [...this.data.menuItems],
    };
  }

  public getItemById(itemId: string): MenuItem | undefined {
    return this.data.menuItems.find((it) => it.id === itemId);
  }

  public toggleItemAvailability(itemId: string, isAvailable?: boolean): MenuItem {
    const item = this.data.menuItems.find((it) => it.id === itemId);
    if (!item) {
      throw new Error(`Menu item with ID "${itemId}" not found.`);
    }
    item.isAvailable = typeof isAvailable === 'boolean' ? isAvailable : !item.isAvailable;
    this.persist();
    
    // Broadcast stock change to all active tabs & carts!
    this.broadcast('item:stock_changed', {
      itemId: item.id,
      name: item.name,
      isAvailable: item.isAvailable,
    });
    this.broadcast('menu:updated', this.getMenu());
    return item;
  }

  public createMenuItem(itemData: Omit<MenuItem, 'id'> & { id?: string }): MenuItem {
    if (!itemData.name || typeof itemData.name !== 'string' || itemData.name.trim() === '') {
      throw new Error('Item name is required and cannot be empty.');
    }
    if (typeof itemData.basePrice !== 'number' || itemData.basePrice <= 0) {
      throw new Error('Base price must be a positive number.');
    }
    if (!itemData.categoryId || !this.data.categories.some((c) => c.id === itemData.categoryId)) {
      throw new Error('Valid category is required.');
    }

    const id = itemData.id || `dish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: MenuItem = {
      id,
      categoryId: itemData.categoryId,
      name: itemData.name.trim(),
      description: (itemData.description || '').trim(),
      basePrice: Math.round(itemData.basePrice * 100) / 100,
      image: itemData.image || '',
      isAvailable: typeof itemData.isAvailable === 'boolean' ? itemData.isAvailable : true,
      dietary: Array.isArray(itemData.dietary) ? itemData.dietary : [],
      prepTimeMinutes: Math.max(1, Math.min(120, itemData.prepTimeMinutes || 15)),
      variants: Array.isArray(itemData.variants) && itemData.variants.length > 0
        ? itemData.variants.map((v) => ({
            id: v.id || `var-${Math.random().toString(36).substring(2, 6)}`,
            name: v.name.trim(),
            price: Math.round(v.price * 100) / 100,
          }))
        : [{ id: 'regular', name: 'Regular', price: Math.round(itemData.basePrice * 100) / 100 }],
      popular: !!itemData.popular,
    };

    this.data.menuItems.push(newItem);
    this.persist();
    this.broadcast('menu:updated', this.getMenu());
    return newItem;
  }

  public updateMenuItem(itemId: string, patch: Partial<MenuItem>): MenuItem {
    const index = this.data.menuItems.findIndex((it) => it.id === itemId);
    if (index === -1) {
      throw new Error(`Item ${itemId} not found`);
    }

    const current = this.data.menuItems[index];
    const updated: MenuItem = {
      ...current,
      ...patch,
      id: current.id, // prevent ID change
      basePrice: patch.basePrice !== undefined ? Math.round(patch.basePrice * 100) / 100 : current.basePrice,
      variants: Array.isArray(patch.variants)
        ? patch.variants.map((v) => ({
            id: v.id || `var-${Math.random().toString(36).substring(2, 6)}`,
            name: v.name.trim(),
            price: Math.round(v.price * 100) / 100,
          }))
        : current.variants,
    };

    this.data.menuItems[index] = updated;
    this.persist();
    this.broadcast('menu:updated', this.getMenu());
    return updated;
  }

  public deleteMenuItem(itemId: string): void {
    const index = this.data.menuItems.findIndex((it) => it.id === itemId);
    if (index === -1) {
      throw new Error(`Item ${itemId} not found`);
    }
    this.data.menuItems.splice(index, 1);
    this.persist();
    this.broadcast('menu:updated', this.getMenu());
  }

  public resetDemoData(): void {
    this.data = {
      categories: DEFAULT_CATEGORIES,
      menuItems: DEFAULT_MENU_ITEMS,
      orders: getInitialSeedOrders(),
      lastOrderNumber: 104,
    };
    this.persist();
    this.broadcast('menu:updated', this.getMenu());
    this.broadcast('order:updated', { reset: true });
  }

  // --- Authoritative Server Price Calculation & Order Placement ---
  /**
   * Computes prices entirely on the server based on authoritative database menu items & variants.
   * Client prices are never accepted or trusted!
   */
  public calculateServerOrder(itemsInput: CreateOrderPayload['items']): {
    orderItems: OrderItem[];
    subtotal: number;
    tax: number;
    totalAmount: number;
  } {
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      throw new Error('Order must contain at least one menu item.');
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const input of itemsInput) {
      if (!input.itemId) {
        throw new Error('Item ID is required for each order line.');
      }
      const item = this.getItemById(input.itemId);
      if (!item) {
        throw new Error(`Menu item not found: ${input.itemId}`);
      }

      // Check stock availability
      if (!item.isAvailable) {
        throw new Error(`"${item.name}" is currently out of stock. Please remove it from your cart.`);
      }

      // Validate quantity
      const quantity = Math.floor(Number(input.quantity));
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for "${item.name}". Must be at least 1.`);
      }
      if (quantity > 50) {
        throw new Error(`Quantity for "${item.name}" exceeds maximum allowed order limit (50).`);
      }

      // Authoritative pricing: look up variant or basePrice
      let unitPrice = item.basePrice;
      let variantName: string | undefined = undefined;

      if (input.variantId && Array.isArray(item.variants) && item.variants.length > 0) {
        const variant = item.variants.find((v) => v.id === input.variantId);
        if (!variant) {
          throw new Error(`Selected variant "${input.variantId}" is not valid for "${item.name}".`);
        }
        unitPrice = variant.price;
        variantName = variant.name;
      } else if (Array.isArray(item.variants) && item.variants.length > 0) {
        // Default to first variant if none selected
        unitPrice = item.variants[0].price;
        variantName = item.variants[0].name;
      }

      // Ensure 2 decimal places
      unitPrice = Math.round(unitPrice * 100) / 100;
      const itemTotal = Math.round(unitPrice * quantity * 100) / 100;
      subtotal += itemTotal;

      orderItems.push({
        itemId: item.id,
        name: item.name,
        variantId: input.variantId,
        variantName,
        unitPrice,
        quantity,
        itemTotal,
        notes: input.notes ? String(input.notes).slice(0, 200).trim() : undefined,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    return {
      orderItems,
      subtotal,
      tax,
      totalAmount,
    };
  }

  public createOrder(payload: CreateOrderPayload): Order {
    // 1. Validate Order Type & Destination
    if (!payload.orderType || !['dine_in', 'takeaway'].includes(payload.orderType)) {
      throw new Error('Order type must be either "dine_in" or "takeaway".');
    }

    let tableNumber: number | undefined;
    let customerName: string | undefined;
    let customerPhone: string | undefined;

    if (payload.orderType === 'dine_in') {
      const tbl = Number(payload.tableNumber);
      if (isNaN(tbl) || tbl < 1 || tbl > 100) {
        throw new Error('Please select a valid table number (1 to 100).');
      }
      tableNumber = tbl;
    } else {
      if (!payload.customerName || typeof payload.customerName !== 'string' || payload.customerName.trim().length < 2) {
        throw new Error('Please enter customer name (at least 2 characters) for takeaway.');
      }
      if (!payload.customerPhone || typeof payload.customerPhone !== 'string' || payload.customerPhone.trim().length < 7) {
        throw new Error('Please enter a valid contact phone number for takeaway.');
      }
      customerName = payload.customerName.trim();
      customerPhone = payload.customerPhone.trim();
    }

    // 2. Authoritative Price & Item Calculation
    const calculated = this.calculateServerOrder(payload.items);

    // 3. Construct Order Document
    this.data.lastOrderNumber = (this.data.lastOrderNumber || 100) + 1;
    const nowIso = new Date().toISOString();
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: this.data.lastOrderNumber,
      orderType: payload.orderType,
      tableNumber,
      customerId: payload.customerId,
      customerName: customerName || payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: customerPhone || payload.customerPhone,
      notes: payload.notes ? String(payload.notes).slice(0, 300).trim() : undefined,
      items: calculated.orderItems,
      subtotal: calculated.subtotal,
      tax: calculated.tax,
      totalAmount: calculated.totalAmount,
      status: 'received',
      statusHistory: [
        {
          status: 'received',
          timestamp: nowIso,
          note: payload.orderType === 'dine_in'
            ? `Order placed from Table ${tableNumber}`
            : `Takeaway order placed for ${customerName || payload.customerName}`,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.data.orders.unshift(newOrder);
    this.persist();

    // 4. Live SSE Broadcast to Kitchen Display & Admin
    this.broadcast('order:created', newOrder);

    return newOrder;
  }

  public getCustomerOrders(query: { email?: string; phone?: string; customerId?: string }): Order[] {
    const qEmail = query.email?.trim().toLowerCase();
    const qPhone = query.phone?.trim();
    const qId = query.customerId?.trim();

    return this.data.orders
      .filter((o) => {
        if (qId && o.customerId === qId) return true;
        if (qEmail && o.customerEmail && o.customerEmail.toLowerCase() === qEmail) return true;
        if (qPhone && o.customerPhone && o.customerPhone.replace(/\D/g, '') === qPhone.replace(/\D/g, '')) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrders(filters?: { status?: OrderStatus; date?: string; orderType?: string }): Order[] {
    let list = [...this.data.orders];

    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.orderType) {
      list = list.filter((o) => o.orderType === filters.orderType);
    }
    if (filters?.date) {
      list = list.filter((o) => o.createdAt.startsWith(filters.date!));
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.data.orders.find((o) => o.id === orderId);
  }

  public updateOrderStatus(orderId: string, nextStatus: OrderStatus, note?: string): Order {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const validStatuses: OrderStatus[] = ['received', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(nextStatus)) {
      throw new Error(`Invalid status: ${nextStatus}`);
    }

    const nowIso = new Date().toISOString();
    order.status = nextStatus;
    order.updatedAt = nowIso;
    order.statusHistory.push({
      status: nextStatus,
      timestamp: nowIso,
      note: note || `Status updated to ${nextStatus}`,
    });

    this.persist();

    // Broadcast live status update to Customer screen and Kitchen
    this.broadcast('order:updated', order);
    return order;
  }

  // --- Order Cancellation ---
  public cancelOrder(orderId: string, note?: string): Order {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const cancellableStatuses: OrderStatus[] = ['received', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error(`Cannot cancel an order with status "${order.status}".`);
    }

    const nowIso = new Date().toISOString();
    order.status = 'cancelled';
    order.updatedAt = nowIso;
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: nowIso,
      note: note || 'Order cancelled',
    });

    this.persist();

    // Broadcast live cancellation to Customer screen and Kitchen
    this.broadcast('order:updated', order);
    return order;
  }

  // --- Customer Satisfaction Rating ---
  public rateOrder(orderId: string, ratingData: SubmitRatingPayload): Order {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (order.status !== 'served') {
      throw new Error('Satisfaction ratings can only be submitted after your order has been served.');
    }

    const stars = Math.round(Number(ratingData.rating));
    if (isNaN(stars) || stars < 1 || stars > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }

    const cleanAspects = Array.isArray(ratingData.aspects)
      ? ratingData.aspects.map((a) => String(a).slice(0, 50).trim()).filter(Boolean)
      : [];

    const cleanComment = ratingData.comment ? String(ratingData.comment).slice(0, 500).trim() : undefined;

    const orderRating: OrderRating = {
      rating: stars,
      aspects: cleanAspects,
      comment: cleanComment,
      itemRatings: ratingData.itemRatings || {},
      createdAt: new Date().toISOString(),
    };

    order.rating = orderRating;
    order.updatedAt = new Date().toISOString();
    this.persist();

    // Broadcast rating event to active admin screens & tracker
    this.broadcast('order:rated', { orderId: order.id, rating: orderRating });
    this.broadcast('order:updated', order);
    return order;
  }

  // --- Admin Analytics ---
  public getAnalytics(): AnalyticsSummary {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = this.data.orders.filter((o) => o.createdAt.startsWith(today));
    
    const validOrders = todayOrders.filter((o) => o.status !== 'cancelled');
    const todayRevenue = Math.round(validOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;
    const todayOrdersCount = validOrders.length;
    const averageOrderValue = todayOrdersCount > 0 ? Math.round((todayRevenue / todayOrdersCount) * 100) / 100 : 0;
    const activeOrdersCount = todayOrders.filter((o) => ['received', 'preparing', 'ready'].includes(o.status)).length;

    const statusBreakdown: Record<OrderStatus, number> = {
      received: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      cancelled: 0,
    };
    for (const o of todayOrders) {
      if (statusBreakdown[o.status] !== undefined) {
        statusBreakdown[o.status]++;
      }
    }

    // Popular items ranking
    const itemMap = new Map<string, { itemId: string; name: string; count: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const cur = itemMap.get(item.itemId) || { itemId: item.itemId, name: item.name, count: 0, revenue: 0 };
        cur.count += item.quantity;
        cur.revenue += item.itemTotal;
        itemMap.set(item.itemId, cur);
      }
    }
    const popularItems = Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((it) => ({
        ...it,
        revenue: Math.round(it.revenue * 100) / 100,
      }));

    // Hourly distribution
    const hourlyMap = new Map<number, { count: number; revenue: number }>();
    for (let h = 9; h <= 23; h++) {
      hourlyMap.set(h, { count: 0, revenue: 0 });
    }
    for (const o of validOrders) {
      const hour = new Date(o.createdAt).getHours();
      const existing = hourlyMap.get(hour) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += o.totalAmount;
      hourlyMap.set(hour, existing);
    }
    const hourlySales = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }));

    // Customer Satisfaction metrics
    const ratedOrders = this.data.orders.filter((o) => o.rating && typeof o.rating.rating === 'number');
    const totalRatings = ratedOrders.length;
    const ratingSum = ratedOrders.reduce((sum, o) => sum + o.rating!.rating, 0);
    const averageRating = totalRatings > 0 ? Math.round((ratingSum / totalRatings) * 10) / 10 : 0;

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const o of ratedOrders) {
      const r = Math.round(o.rating!.rating);
      if (ratingBreakdown[r] !== undefined) {
        ratingBreakdown[r]++;
      }
    }

    const recentFeedbacks: RecentFeedbackEntry[] = ratedOrders
      .sort((a, b) => new Date(b.rating!.createdAt).getTime() - new Date(a.rating!.createdAt).getTime())
      .slice(0, 10)
      .map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        rating: o.rating!.rating,
        aspects: o.rating!.aspects,
        comment: o.rating!.comment,
        createdAt: o.rating!.createdAt,
      }));

    return {
      todayRevenue,
      todayOrdersCount,
      averageOrderValue,
      activeOrdersCount,
      statusBreakdown,
      popularItems,
      hourlySales,
      satisfactionSummary: {
        averageRating,
        totalRatings,
        ratingBreakdown,
        recentFeedbacks,
      },
    };
  }
}

export const db = new RestaurantDatabase();
