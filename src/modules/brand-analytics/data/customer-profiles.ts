/**
 * Customer profiles for personalized query generation
 * This file contains seed data for customer profiles that can be used to generate personalized queries
 */

export interface CustomerInterest {
  category: string;
  level: 'low' | 'medium' | 'high';
  preferences?: string[];
  avoidances?: string[];
}

export interface CustomerProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  location?: string;
  occupation?: string;
  interests: CustomerInterest[];
  purchaseHistory?: {
    category: string;
    brand: string;
    date: Date;
  }[];
  searchHistory?: {
    query: string;
    date: Date;
  }[];
  persona: string;
  budget?: 'low' | 'medium' | 'high';
}

export const customerProfiles: CustomerProfile[] = [
  {
    id: 'customer_1',
    name: 'Alex Johnson',
    age: 28,
    gender: 'Male',
    location: 'Seattle, WA',
    occupation: 'Software Engineer',
    interests: [
      {
        category: 'Running Shoes',
        level: 'high',
        preferences: ['cushioning', 'lightweight', 'durability'],
        avoidances: ['bulky', 'stiff'],
      },
      {
        category: 'Fitness Equipment',
        level: 'medium',
        preferences: ['compact', 'versatile', 'tech-enabled'],
        avoidances: ['expensive', 'complicated setup'],
      },
      {
        category: 'Smartphones',
        level: 'high',
        preferences: ['performance', 'camera quality', 'battery life'],
        avoidances: ['budget models', 'limited storage'],
      },
    ],
    purchaseHistory: [
      {
        category: 'Running Shoes',
        brand: 'Nike',
        date: new Date('2023-10-15'),
      },
      {
        category: 'Smartphones',
        brand: 'Samsung',
        date: new Date('2023-08-22'),
      },
      {
        category: 'Fitness Equipment',
        brand: 'Bowflex',
        date: new Date('2023-06-10'),
      },
    ],
    searchHistory: [
      {
        query: 'best running shoes for marathon training',
        date: new Date('2023-12-05'),
      },
      {
        query: 'compare Samsung vs Google Pixel',
        date: new Date('2023-11-20'),
      },
      {
        query: 'compact home gym equipment',
        date: new Date('2023-10-30'),
      },
    ],
    persona:
      'Tech-savvy fitness enthusiast who runs regularly and values quality products with the latest technology.',
    budget: 'high',
  },
  {
    id: 'customer_2',
    name: 'Sarah Miller',
    age: 34,
    gender: 'Female',
    location: 'Portland, OR',
    occupation: 'Marketing Manager',
    interests: [
      {
        category: 'Sportswear',
        level: 'high',
        preferences: ['sustainable', 'stylish', 'comfortable'],
        avoidances: ['fast fashion', 'synthetic materials'],
      },
      {
        category: 'Yoga Equipment',
        level: 'high',
        preferences: ['eco-friendly', 'durable', 'non-slip'],
        avoidances: ['chemical smell', 'cheap materials'],
      },
      {
        category: 'Athletic Shoes',
        level: 'medium',
        preferences: ['versatile', 'sustainable', 'stylish'],
        avoidances: ['bulky', 'flashy colors'],
      },
    ],
    purchaseHistory: [
      {
        category: 'Sportswear',
        brand: 'Lululemon',
        date: new Date('2023-11-05'),
      },
      {
        category: 'Yoga Equipment',
        brand: 'Manduka',
        date: new Date('2023-09-18'),
      },
      {
        category: 'Athletic Shoes',
        brand: 'Adidas',
        date: new Date('2023-07-22'),
      },
    ],
    searchHistory: [
      {
        query: 'sustainable athletic wear brands',
        date: new Date('2023-12-10'),
      },
      {
        query: 'best yoga mat for hot yoga',
        date: new Date('2023-11-25'),
      },
      {
        query: 'stylish cross-training shoes',
        date: new Date('2023-10-15'),
      },
    ],
    persona:
      'Environmentally conscious yoga enthusiast who values sustainability and style in athletic products.',
    budget: 'medium',
  },
  {
    id: 'customer_3',
    name: 'Michael Chen',
    age: 42,
    gender: 'Male',
    location: 'Chicago, IL',
    occupation: 'Financial Analyst',
    interests: [
      {
        category: 'Basketball Shoes',
        level: 'high',
        preferences: ['ankle support', 'traction', 'durability'],
        avoidances: ['heavy', 'poor ventilation'],
      },
      {
        category: 'Sportswear',
        level: 'medium',
        preferences: ['moisture-wicking', 'comfortable', 'durable'],
        avoidances: ['tight fit', 'thin material'],
      },
      {
        category: 'Fitness Equipment',
        level: 'low',
        preferences: [
          'space-efficient',
          'multi-purpose',
          'quality construction',
        ],
        avoidances: ['complex assembly', 'subscription required'],
      },
    ],
    purchaseHistory: [
      {
        category: 'Basketball Shoes',
        brand: 'Nike',
        date: new Date('2023-10-28'),
      },
      {
        category: 'Sportswear',
        brand: 'Under Armour',
        date: new Date('2023-09-05'),
      },
      {
        category: 'Fitness Equipment',
        brand: 'NordicTrack',
        date: new Date('2023-05-15'),
      },
    ],
    searchHistory: [
      {
        query: 'best basketball shoes for outdoor courts',
        date: new Date('2023-12-15'),
      },
      {
        query: 'moisture-wicking athletic shirts',
        date: new Date('2023-11-10'),
      },
      {
        query: 'compact home gym equipment',
        date: new Date('2023-10-05'),
      },
    ],
    persona:
      'Weekend basketball player who values performance and durability in athletic gear.',
    budget: 'medium',
  },
  {
    id: 'customer_4',
    name: 'Emily Rodriguez',
    age: 23,
    gender: 'Female',
    location: 'Miami, FL',
    occupation: 'Fitness Instructor',
    interests: [
      {
        category: 'Cross-Training Shoes',
        level: 'high',
        preferences: ['versatile', 'stable', 'lightweight'],
        avoidances: ['narrow toe box', 'poor support'],
      },
      {
        category: 'Sportswear',
        level: 'high',
        preferences: ['compression', 'sweat-wicking', 'stylish'],
        avoidances: ['loose fit', 'fading colors'],
      },
      {
        category: 'Fitness Equipment',
        level: 'high',
        preferences: ['portable', 'versatile', 'durable'],
        avoidances: ['bulky', 'single-purpose'],
      },
    ],
    purchaseHistory: [
      {
        category: 'Cross-Training Shoes',
        brand: 'Nike',
        date: new Date('2023-11-20'),
      },
      {
        category: 'Sportswear',
        brand: 'Gymshark',
        date: new Date('2023-10-10'),
      },
      {
        category: 'Fitness Equipment',
        brand: 'Rogue Fitness',
        date: new Date('2023-08-05'),
      },
    ],
    searchHistory: [
      {
        query: 'best shoes for HIIT workouts',
        date: new Date('2023-12-18'),
      },
      {
        query: 'compression leggings for fitness instructors',
        date: new Date('2023-11-30'),
      },
      {
        query: 'portable fitness equipment for trainers',
        date: new Date('2023-11-05'),
      },
    ],
    persona:
      'Professional fitness instructor who needs high-performance gear for various workout styles.',
    budget: 'high',
  },
  {
    id: 'customer_5',
    name: 'David Wilson',
    age: 52,
    gender: 'Male',
    location: 'Denver, CO',
    occupation: 'Physical Therapist',
    interests: [
      {
        category: 'Running Shoes',
        level: 'high',
        preferences: ['stability', 'support', 'cushioning'],
        avoidances: ['minimal', 'zero drop'],
      },
      {
        category: 'Fitness Equipment',
        level: 'high',
        preferences: ['therapeutic', 'adjustable', 'ergonomic'],
        avoidances: ['gimmicky', 'poor quality'],
      },
      {
        category: 'Athletic Shoes',
        level: 'medium',
        preferences: ['orthotic-friendly', 'wide toe box', 'supportive'],
        avoidances: ['narrow fit', 'poor arch support'],
      },
    ],
    purchaseHistory: [
      {
        category: 'Running Shoes',
        brand: 'Brooks',
        date: new Date('2023-11-15'),
      },
      {
        category: 'Fitness Equipment',
        brand: 'TheraBand',
        date: new Date('2023-09-28'),
      },
      {
        category: 'Athletic Shoes',
        brand: 'New Balance',
        date: new Date('2023-07-10'),
      },
    ],
    searchHistory: [
      {
        query: 'best stability running shoes for overpronation',
        date: new Date('2023-12-20'),
      },
      {
        query: 'therapeutic exercise equipment for home',
        date: new Date('2023-11-15'),
      },
      {
        query: 'wide toe box athletic shoes',
        date: new Date('2023-10-25'),
      },
    ],
    persona:
      'Health professional who values proper biomechanics and injury prevention in athletic products.',
    budget: 'medium',
  },
];

/**
 * Get a customer profile by ID
 * @param id The customer ID
 * @returns The customer profile or undefined if not found
 */
export function getCustomerById(id: string): CustomerProfile | undefined {
  return customerProfiles.find(customer => customer.id === id);
}

/**
 * Get customer profiles interested in a specific category
 * @param category The category name
 * @param interestLevel Optional minimum interest level
 * @returns Array of matching customer profiles
 */
export function getCustomersByInterest(
  category: string,
  interestLevel?: 'low' | 'medium' | 'high',
): CustomerProfile[] {
  return customerProfiles.filter(customer => {
    const interest = customer.interests.find(
      i => i.category.toLowerCase() === category.toLowerCase(),
    );

    if (!interest) return false;
    if (
      interestLevel &&
      getInterestLevelValue(interest.level) <
        getInterestLevelValue(interestLevel)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Convert interest level to numeric value for comparison
 * @param level The interest level
 * @returns Numeric value (1=low, 2=medium, 3=high)
 */
function getInterestLevelValue(level: 'low' | 'medium' | 'high'): number {
  switch (level) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
  }
  return 0;
}

/**
 * Generate personalized queries for a customer based on their profile
 * @param customerId The customer ID
 * @param count Number of queries to generate
 * @returns Array of personalized query strings
 */
export function generatePersonalizedQueries(
  customerId: string,
  count: number = 5,
): string[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];

  const queries: string[] = [];

  // Generate queries based on high-interest categories
  const highInterests = customer.interests.filter(i => i.level === 'high');

  for (const interest of highInterests) {
    // Add category-specific queries
    queries.push(
      `What are the best ${interest.category.toLowerCase()} for ${customer.persona.split(' ')[0]}?`,
    );

    // Add preference-specific queries
    if (interest.preferences && interest.preferences.length > 0) {
      const randomPref =
        interest.preferences[
          Math.floor(Math.random() * interest.preferences.length)
        ];
      queries.push(
        `Which ${interest.category.toLowerCase()} has the best ${randomPref}?`,
      );
    }

    // Add avoidance-specific queries
    if (interest.avoidances && interest.avoidances.length > 0) {
      const randomAvoid =
        interest.avoidances[
          Math.floor(Math.random() * interest.avoidances.length)
        ];
      queries.push(
        `What ${interest.category.toLowerCase()} should I avoid if I don't want ${randomAvoid}?`,
      );
    }
  }

  // Add purchase history related queries
  if (customer.purchaseHistory && customer.purchaseHistory.length > 0) {
    const recentPurchase = customer.purchaseHistory[0];
    queries.push(
      `What's better than ${recentPurchase.brand} for ${recentPurchase.category.toLowerCase()}?`,
    );
    queries.push(
      `How does ${recentPurchase.brand} compare to other brands for ${recentPurchase.category.toLowerCase()}?`,
    );
  }

  // Add budget-specific queries
  if (customer.budget) {
    const randomInterest =
      customer.interests[Math.floor(Math.random() * customer.interests.length)];
    if (customer.budget === 'low') {
      queries.push(
        `What's a good budget ${randomInterest.category.toLowerCase()}?`,
      );
    } else if (customer.budget === 'high') {
      queries.push(
        `What's the best premium ${randomInterest.category.toLowerCase()}?`,
      );
    } else {
      queries.push(
        `What ${randomInterest.category.toLowerCase()} offers the best value for money?`,
      );
    }
  }

  // Add location-specific queries if location is available
  if (customer.location) {
    const city = customer.location.split(',')[0].trim();
    const randomInterest =
      customer.interests[Math.floor(Math.random() * customer.interests.length)];
    queries.push(
      `Where can I buy ${randomInterest.category.toLowerCase()} in ${city}?`,
    );
  }

  // Shuffle and limit to requested count
  const shuffled = queries.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
