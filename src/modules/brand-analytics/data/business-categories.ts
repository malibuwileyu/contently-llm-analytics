/**
 * Seed data for business categories
 * This file contains initial data for populating the business_categories table
 */

export interface BusinessCategoryData {
  name: string;
  description: string;
  keywords: string[];
  synonyms: string[];
  parentCategory?: string;
  subcategories?: BusinessCategoryData[];
}

export const businessCategories: BusinessCategoryData[] = [
  {
    name: 'Athletic Shoes',
    description: 'Footwear designed for sports and athletic activities',
    keywords: [
      'running shoes',
      'sneakers',
      'trainers',
      'athletic footwear',
      'sports shoes',
    ],
    synonyms: ['sneakers', 'trainers', 'kicks', 'athletic footwear'],
    subcategories: [
      {
        name: 'Running Shoes',
        description: 'Shoes designed specifically for running and jogging',
        keywords: [
          'marathon',
          'jogging',
          'trail running',
          'road running',
          'sprinting',
        ],
        synonyms: ['runners', 'jogging shoes', 'running trainers'],
      },
      {
        name: 'Basketball Shoes',
        description: 'High-top shoes designed for basketball players',
        keywords: [
          'high-top',
          'court shoes',
          'basketball sneakers',
          'ankle support',
        ],
        synonyms: ['basketball sneakers', 'court shoes', 'high-tops'],
      },
      {
        name: 'Cross-Training Shoes',
        description: 'Versatile athletic shoes for various activities',
        keywords: [
          'gym shoes',
          'workout shoes',
          'fitness shoes',
          'training shoes',
        ],
        synonyms: ['trainers', 'workout shoes', 'gym shoes'],
      },
    ],
  },
  {
    name: 'Sportswear',
    description: 'Clothing designed for sports and athletic activities',
    keywords: [
      'athletic wear',
      'activewear',
      'sports clothing',
      'performance wear',
    ],
    synonyms: ['athletic wear', 'activewear', 'athletic apparel'],
    subcategories: [
      {
        name: 'Athletic Tops',
        description: 'Shirts, jerseys, and tops designed for sports',
        keywords: [
          'sports shirts',
          'jerseys',
          'performance tops',
          'athletic shirts',
        ],
        synonyms: ['sports tops', 'athletic shirts', 'performance tops'],
      },
      {
        name: 'Athletic Bottoms',
        description: 'Shorts, pants, and leggings designed for sports',
        keywords: ['sports shorts', 'athletic pants', 'leggings', 'sweatpants'],
        synonyms: ['sports bottoms', 'athletic pants', 'performance bottoms'],
      },
      {
        name: 'Outerwear',
        description: 'Jackets, vests, and outer layers for sports',
        keywords: [
          'sports jackets',
          'windbreakers',
          'athletic jackets',
          'vests',
        ],
        synonyms: [
          'sports outerwear',
          'athletic jackets',
          'performance outerwear',
        ],
      },
    ],
  },
  {
    name: 'Fitness Equipment',
    description: 'Equipment and gear for fitness and exercise',
    keywords: [
      'gym equipment',
      'workout gear',
      'exercise equipment',
      'fitness gear',
    ],
    synonyms: ['exercise equipment', 'workout equipment', 'gym gear'],
    subcategories: [
      {
        name: 'Cardio Equipment',
        description: 'Equipment for cardiovascular exercise',
        keywords: [
          'treadmills',
          'ellipticals',
          'exercise bikes',
          'rowing machines',
        ],
        synonyms: [
          'cardio machines',
          'aerobic equipment',
          'cardiovascular equipment',
        ],
      },
      {
        name: 'Strength Training',
        description: 'Equipment for strength and resistance training',
        keywords: [
          'weights',
          'dumbbells',
          'barbells',
          'resistance bands',
          'kettlebells',
        ],
        synonyms: [
          'weight training equipment',
          'resistance equipment',
          'strength equipment',
        ],
      },
      {
        name: 'Yoga & Pilates',
        description: 'Equipment for yoga and pilates',
        keywords: [
          'yoga mats',
          'yoga blocks',
          'pilates reformers',
          'resistance rings',
        ],
        synonyms: [
          'yoga equipment',
          'pilates equipment',
          'mind-body equipment',
        ],
      },
    ],
  },
  {
    name: 'Online Shopping',
    description: 'E-commerce and online retail platforms',
    keywords: [
      'e-commerce',
      'online retail',
      'online stores',
      'internet shopping',
    ],
    synonyms: [
      'e-commerce',
      'online retail',
      'internet shopping',
      'digital shopping',
    ],
    subcategories: [
      {
        name: 'Marketplace Platforms',
        description: 'Multi-vendor online shopping platforms',
        keywords: ['online marketplace', 'multi-vendor', 'e-commerce platform'],
        synonyms: [
          'online marketplaces',
          'digital marketplaces',
          'e-commerce platforms',
        ],
      },
      {
        name: 'Direct-to-Consumer',
        description: 'Brands selling directly to consumers online',
        keywords: [
          'DTC',
          'direct sales',
          'brand websites',
          'manufacturer direct',
        ],
        synonyms: ['DTC', 'direct sales', 'brand e-commerce', 'direct retail'],
      },
      {
        name: 'Subscription Services',
        description: 'Recurring delivery of products via online subscription',
        keywords: [
          'subscription boxes',
          'recurring delivery',
          'subscription retail',
        ],
        synonyms: [
          'subscription boxes',
          'subscription retail',
          'recurring commerce',
        ],
      },
    ],
  },
  {
    name: 'Smartphones',
    description: 'Mobile phones with advanced computing capability',
    keywords: [
      'mobile phones',
      'cell phones',
      'iPhones',
      'Android phones',
      'mobile devices',
    ],
    synonyms: ['mobile phones', 'cell phones', 'phones', 'mobile devices'],
    subcategories: [
      {
        name: 'iOS Devices',
        description: 'Apple iPhones and iOS-based smartphones',
        keywords: ['iPhone', 'Apple phone', 'iOS smartphone'],
        synonyms: ['iPhones', 'Apple phones', 'iOS devices'],
      },
      {
        name: 'Android Devices',
        description: 'Smartphones running the Android operating system',
        keywords: [
          'Android phone',
          'Google phone',
          'Samsung phone',
          'Pixel phone',
        ],
        synonyms: ['Android phones', 'Google phones', 'Android devices'],
      },
      {
        name: 'Budget Smartphones',
        description: 'Affordable smartphones with good value',
        keywords: [
          'cheap phones',
          'affordable smartphones',
          'budget phones',
          'value phones',
        ],
        synonyms: ['budget phones', 'affordable phones', 'value smartphones'],
      },
    ],
  },
];

/**
 * Flattens the hierarchical business category data into a simple array
 * @returns Flattened array of business categories with parent references
 */
export function getFlattenedBusinessCategories(): BusinessCategoryData[] {
  const flattened: BusinessCategoryData[] = [];

  function flatten(category: BusinessCategoryData, parentName?: string) {
    const { subcategories, ...categoryData } = category;
    flattened.push({
      ...categoryData,
      parentCategory: parentName,
    });

    if (subcategories) {
      subcategories.forEach(sub => flatten(sub, category.name));
    }
  }

  businessCategories.forEach(category => flatten(category));
  return flattened;
}
