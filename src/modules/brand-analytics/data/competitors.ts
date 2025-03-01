/**
 * Seed data for competitors
 * This file contains initial data for populating the competitors table
 */

export interface CompetitorData {
  name: string;
  description: string;
  website: string;
  businessCategory: string;
  marketShare?: number; // Percentage (0-100)
  founded?: number; // Year
  headquarters?: string;
  keyProducts?: string[];
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export const competitors: Record<string, CompetitorData[]> = {
  'Athletic Shoes': [
    {
      name: 'Nike',
      description:
        'Global leader in athletic footwear, apparel, equipment and accessories',
      website: 'https://www.nike.com',
      businessCategory: 'Athletic Shoes',
      marketShare: 37.4,
      founded: 1964,
      headquarters: 'Beaverton, _Oregon, USA',
      keyProducts: ['Air Jordan', 'Air Force 1', 'Air Max', 'React', 'Flyknit'],
      socialMedia: {
        twitter: '@Nike',
        instagram: '@nike',
        facebook: 'nike',
        linkedin: 'nike',
      },
    },
    {
      name: 'Adidas',
      description:
        'Multinational corporation specializing in sports footwear, apparel and accessories',
      website: 'https://www.adidas.com',
      businessCategory: 'Athletic Shoes',
      marketShare: 18.3,
      founded: 1949,
      headquarters: 'Herzogenaurach, Germany',
      keyProducts: ['Ultraboost', 'NMD', 'Superstar', 'Stan Smith', 'Yeezy'],
      socialMedia: {
        twitter: '@adidas',
        instagram: '@adidas',
        facebook: 'adidas',
        linkedin: 'adidas',
      },
    },
    {
      name: 'New Balance',
      description: 'American sports footwear and apparel manufacturer',
      website: 'https://www.newbalance.com',
      businessCategory: 'Athletic Shoes',
      marketShare: 5.2,
      founded: 1906,
      headquarters: 'Boston, _Massachusetts, USA',
      keyProducts: ['990', '574', '997', 'Fresh Foam', 'FuelCell'],
      socialMedia: {
        twitter: '@newbalance',
        instagram: '@newbalance',
        facebook: 'newbalance',
        linkedin: 'new-balance',
      },
    },
    {
      name: 'Under Armour',
      description:
        'American sports equipment company that manufactures footwear, sports and casual apparel',
      website: 'https://www.underarmour.com',
      businessCategory: 'Athletic Shoes',
      marketShare: 3.1,
      founded: 1996,
      headquarters: 'Baltimore, _Maryland, USA',
      keyProducts: [
        'HOVR',
        'Project Rock',
        'Curry',
        'Charged Cushioning',
        'ClutchFit',
      ],
      socialMedia: {
        twitter: '@UnderArmour',
        instagram: '@underarmour',
        facebook: 'underarmour',
        linkedin: 'under-armour',
      },
    },
  ],
  'Running Shoes': [
    {
      name: 'Brooks',
      description:
        'American sports equipment company focused exclusively on running shoes and apparel',
      website: 'https://www.brooksrunning.com',
      businessCategory: 'Running Shoes',
      marketShare: 8.9,
      founded: 1914,
      headquarters: 'Seattle, Washington, USA',
      keyProducts: [
        'Ghost',
        'Adrenaline GTS',
        'Glycerin',
        'Launch',
        'Hyperion',
      ],
      socialMedia: {
        twitter: '@brooksrunning',
        instagram: '@brooksrunning',
        facebook: 'brooksrunning',
        linkedin: 'brooks-running',
      },
    },
    {
      name: 'ASICS',
      description:
        'Japanese multinational corporation producing footwear and sports equipment',
      website: 'https://www.asics.com',
      businessCategory: 'Running Shoes',
      marketShare: 7.4,
      founded: 1949,
      headquarters: 'Kobe, Japan',
      keyProducts: [
        'Gel-Kayano',
        'Gel-Nimbus',
        'Gel-Cumulus',
        'MetaRide',
        'Novablast',
      ],
      socialMedia: {
        twitter: '@ASICS',
        instagram: '@asics',
        facebook: 'asics',
        linkedin: 'asics',
      },
    },
    {
      name: 'Hoka One One',
      description:
        'Athletic shoe company specializing in running shoes with oversized midsoles',
      website: 'https://www.hoka.com',
      businessCategory: 'Running Shoes',
      marketShare: 4.3,
      founded: 2009,
      headquarters: 'Goleta, California, USA',
      keyProducts: ['Clifton', 'Bondi', 'Speedgoat', 'Carbon X', 'Rincon'],
      socialMedia: {
        twitter: '@HOKAONEONE',
        instagram: '@hoka',
        facebook: 'HOKAONEONE',
        linkedin: 'hoka-one-one',
      },
    },
  ],
  Sportswear: [
    {
      name: 'Lululemon',
      description:
        'Athletic apparel retailer known for yoga clothing and athleisure wear',
      website: 'https://www.lululemon.com',
      businessCategory: 'Sportswear',
      marketShare: 6.2,
      founded: 1998,
      headquarters: 'Vancouver, British _Columbia, Canada',
      keyProducts: [
        'Align',
        'Wunder Under',
        'Define Jacket',
        'Metal Vent Tech',
        'ABC Pants',
      ],
      socialMedia: {
        twitter: '@lululemon',
        instagram: '@lululemon',
        facebook: 'lululemon',
        linkedin: 'lululemon-athletica',
      },
    },
    {
      name: 'Puma',
      description:
        'German multinational corporation designing and manufacturing athletic and casual footwear, apparel and accessories',
      website: 'https://www.puma.com',
      businessCategory: 'Sportswear',
      marketShare: 5.6,
      founded: 1948,
      headquarters: 'Herzogenaurach, Germany',
      keyProducts: ['Suede', 'RS-X', 'Future Rider', 'Cali', 'Clyde'],
      socialMedia: {
        twitter: '@PUMA',
        instagram: '@puma',
        facebook: 'PUMA',
        linkedin: 'puma',
      },
    },
    {
      name: 'Gymshark',
      description: 'British fitness apparel and accessories brand',
      website: 'https://www.gymshark.com',
      businessCategory: 'Sportswear',
      marketShare: 2.8,
      founded: 2012,
      headquarters: 'Solihull, _England, UK',
      keyProducts: ['Flex', 'Vital', 'Legacy', 'Apex', 'Crest'],
      socialMedia: {
        twitter: '@Gymshark',
        instagram: '@gymshark',
        facebook: 'gymshark',
        linkedin: 'gymshark',
      },
    },
  ],
  'Fitness Equipment': [
    {
      name: 'Peloton',
      description:
        'Exercise equipment and media company known for internet-connected stationary bicycles and treadmills',
      website: 'https://www.onepeloton.com',
      businessCategory: 'Fitness Equipment',
      marketShare: 12.5,
      founded: 2012,
      headquarters: 'New York City, New York, USA',
      keyProducts: ['Bike', 'Bike+', 'Tread', 'Tread+', 'Guide'],
      socialMedia: {
        twitter: '@onepeloton',
        instagram: '@onepeloton',
        facebook: 'onepeloton',
        linkedin: 'peloton-interactive',
      },
    },
    {
      name: 'NordicTrack',
      description:
        'American company that manufactures treadmills, strength training equipment, and elliptical trainers',
      website: 'https://www.nordictrack.com',
      businessCategory: 'Fitness Equipment',
      marketShare: 9.8,
      founded: 1975,
      headquarters: 'Logan, _Utah, USA',
      keyProducts: [
        'Commercial Series',
        'T Series Treadmills',
        'S Series Bikes',
        'Fusion CST',
        'RW Rowers',
      ],
      socialMedia: {
        twitter: '@NordicTrack',
        instagram: '@nordictrack',
        facebook: 'NordicTrack',
        linkedin: 'nordictrack',
      },
    },
    {
      name: 'Bowflex',
      description:
        'American fitness equipment company specializing in home gym equipment',
      website: 'https://www.bowflex.com',
      businessCategory: 'Fitness Equipment',
      marketShare: 7.3,
      founded: 1986,
      headquarters: 'Vancouver, Washington, USA',
      keyProducts: [
        'Max Trainer',
        'SelectTech',
        'Revolution',
        'TreadClimber',
        'VeloCore',
      ],
      socialMedia: {
        twitter: '@bowflex',
        instagram: '@bowflex',
        facebook: 'bowflex',
        linkedin: 'bowflex',
      },
    },
  ],
  'Online Shopping': [
    {
      name: 'Amazon',
      description:
        'American multinational technology company focusing on e-commerce, cloud computing, digital _streaming, and artificial intelligence',
      website: 'https://www.amazon.com',
      businessCategory: 'Online Shopping',
      marketShare: 38.7,
      founded: 1994,
      headquarters: 'Seattle, Washington, USA',
      keyProducts: [
        'Amazon Prime',
        'Amazon Echo',
        'Amazon Marketplace',
        'Amazon Web Services',
        'Kindle',
      ],
      socialMedia: {
        twitter: '@amazon',
        instagram: '@amazon',
        facebook: 'amazon',
        linkedin: 'amazon',
      },
    },
    {
      name: 'Walmart',
      description:
        'American multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores',
      website: 'https://www.walmart.com',
      businessCategory: 'Online Shopping',
      marketShare: 5.3,
      founded: 1962,
      headquarters: 'Bentonville, _Arkansas, USA',
      keyProducts: [
        'Walmart Marketplace',
        'Walmart+',
        'Grocery Pickup',
        'Walmart Fulfillment Services',
      ],
      socialMedia: {
        twitter: '@Walmart',
        instagram: '@walmart',
        facebook: 'walmart',
        linkedin: 'walmart',
      },
    },
    {
      name: 'Shopify',
      description:
        'Canadian multinational e-commerce company providing a platform for online stores and retail point-of-sale systems',
      website: 'https://www.shopify.com',
      businessCategory: 'Online Shopping',
      marketShare: 10.3,
      founded: 2006,
      headquarters: 'Ottawa, _Ontario, Canada',
      keyProducts: [
        'Shopify Platform',
        'Shopify Plus',
        'Shopify POS',
        'Shopify Payments',
        'Shopify Fulfillment',
      ],
      socialMedia: {
        twitter: '@Shopify',
        instagram: '@shopify',
        facebook: 'shopify',
        linkedin: 'shopify',
      },
    },
  ],
  Smartphones: [
    {
      name: 'Apple',
      description:
        'American multinational technology company that specializes in consumer electronics, software and online services',
      website: 'https://www.apple.com',
      businessCategory: 'Smartphones',
      marketShare: 23.4,
      founded: 1976,
      headquarters: 'Cupertino, California, USA',
      keyProducts: ['iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods'],
      socialMedia: {
        twitter: '@Apple',
        instagram: '@apple',
        facebook: 'apple',
        linkedin: 'apple',
      },
    },
    {
      name: 'Samsung',
      description:
        'South Korean multinational manufacturing conglomerate headquartered in Samsung Town, Seoul, South Korea',
      website: 'https://www.samsung.com',
      businessCategory: 'Smartphones',
      marketShare: 20.1,
      founded: 1938,
      headquarters: 'Seoul, South Korea',
      keyProducts: [
        'Galaxy S Series',
        'Galaxy Note Series',
        'Galaxy Z Series',
        'Galaxy A Series',
        'Galaxy Tab',
      ],
      socialMedia: {
        twitter: '@Samsung',
        instagram: '@samsung',
        facebook: 'SamsungUS',
        linkedin: 'samsung-electronics',
      },
    },
    {
      name: 'Google',
      description:
        'American multinational technology company focusing on search engine technology, online _advertising, cloud computing, computer software, quantum computing, e-commerce, artificial intelligence, and consumer electronics',
      website: 'https://www.google.com',
      businessCategory: 'Smartphones',
      marketShare: 3.2,
      founded: 1998,
      headquarters: 'Mountain View, California, USA',
      keyProducts: [
        'Pixel',
        'Android',
        'Google Search',
        'Google Cloud',
        'Google Workspace',
      ],
      socialMedia: {
        twitter: '@Google',
        instagram: '@google',
        facebook: 'Google',
        linkedin: 'google',
      },
    },
  ],
};

/**
 * Get all competitors as a flat array
 * @returns Array of all competitors across all categories
 */
export function getAllCompetitors(): CompetitorData[] {
  return Object.values(competitors).flat();
}

/**
 * Get competitors for a specific business category
 * @param category The business category name
 * @returns Array of competitors for the specified category
 */
export function getCompetitorsByCategory(category: string): CompetitorData[] {
  return competitors[category] || [];
}
