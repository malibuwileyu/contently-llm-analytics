/**
 * Placeholder values for query templates
 * This file contains values that can be used to replace placeholders in query templates
 */

export interface PlaceholderCategory {
  name: string;
  values: string[];
}

export const placeholderValues: Record<string, PlaceholderCategory> = {
  // Category placeholders
  category: {
    name: 'Product Category',
    values: [
      'running shoes',
      'basketball shoes',
      'cross-training shoes',
      'athletic shoes',
      'sports shoes',
      'sneakers',
      'athletic tops',
      'athletic bottoms',
      'sportswear',
      'athletic wear',
      'fitness equipment',
      'cardio equipment',
      'strength training equipment',
      'yoga equipment',
      'smartphones',
      'iPhones',
      'Android phones',
      'budget phones',
    ],
  },

  // Brand placeholders
  brand: {
    name: 'Brand Name',
    values: [
      'Nike',
      'Adidas',
      'New Balance',
      'Under Armour',
      'Brooks',
      'ASICS',
      'Hoka One One',
      'Lululemon',
      'Puma',
      'Gymshark',
      'Peloton',
      'NordicTrack',
      'Bowflex',
      'Amazon',
      'Walmart',
      'Shopify',
      'Apple',
      'Samsung',
      'Google',
    ],
  },

  brand1: {
    name: 'First Brand for Comparison',
    values: [
      'Nike',
      'Adidas',
      'New Balance',
      'Under Armour',
      'Brooks',
      'ASICS',
      'Lululemon',
      'Puma',
      'Apple',
      'Samsung',
      'Google',
    ],
  },

  brand2: {
    name: 'Second Brand for Comparison',
    values: [
      'Adidas',
      'Nike',
      'Under Armour',
      'New Balance',
      'ASICS',
      'Brooks',
      'Puma',
      'Lululemon',
      'Samsung',
      'Apple',
      'Google',
    ],
  },

  // Feature placeholders
  feature: {
    name: 'Product Feature',
    values: [
      'comfort',
      'durability',
      'support',
      'cushioning',
      'breathability',
      'traction',
      'stability',
      'flexibility',
      'waterproofing',
      'lightweight design',
      'responsiveness',
      'energy return',
      'moisture-wicking',
      'compression',
      'stretch',
      'battery life',
      'camera quality',
      'processing speed',
      'display quality',
      'water resistance',
    ],
  },

  // Use case placeholders
  use_case: {
    name: 'Use Case',
    values: [
      'running',
      'jogging',
      'trail running',
      'marathon training',
      'basketball',
      'cross-training',
      'gym workouts',
      'weightlifting',
      'yoga',
      'pilates',
      'hiking',
      'everyday wear',
      'casual use',
      'professional use',
      'photography',
      'gaming',
      'video streaming',
      'social media',
      'business use',
      'travel',
    ],
  },

  // User profile placeholders
  user_profile: {
    name: 'User Profile',
    values: [
      'is a beginner runner',
      'runs marathons',
      'plays basketball competitively',
      'goes to the gym regularly',
      'has flat feet',
      'has high arches',
      'needs extra ankle support',
      'has knee problems',
      'is on a budget',
      'wants premium quality',
      'values sustainability',
      'prefers lightweight gear',
      'needs extra durability',
      'takes a lot of photos',
      'uses their phone for work',
      'streams a lot of videos',
      'plays mobile games',
      'travels frequently',
      'is always outdoors',
      'values battery life',
    ],
  },

  // Location placeholders
  location: {
    name: 'Location',
    values: [
      'New York',
      'Los Angeles',
      'Chicago',
      'Houston',
      'Phoenix',
      'Philadelphia',
      'San Antonio',
      'San Diego',
      'Dallas',
      'San Francisco',
      'Seattle',
      'Boston',
      'Denver',
      'Washington DC',
      'Atlanta',
      'Miami',
      'London',
      'Toronto',
      'Sydney',
      'Tokyo',
    ],
  },

  // Year placeholders
  year: {
    name: 'Year',
    values: ['2023', '2024', '2025'],
  },
};

/**
 * Get all values for a specific placeholder
 * @param placeholder The placeholder key
 * @returns Array of values for the placeholder or empty array if not found
 */
export function getPlaceholderValues(placeholder: string): string[] {
  return placeholderValues[placeholder]?.values || [];
}

/**
 * Get a random value for a specific placeholder
 * @param placeholder The placeholder key
 * @returns A random value for the placeholder or undefined if not found
 */
export function getRandomPlaceholderValue(
  placeholder: string,
): string | undefined {
  const values = getPlaceholderValues(placeholder);
  if (values.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
}

/**
 * Fill a template with random values for all placeholders
 * @param template The template string with placeholders in {placeholder} format
 * @param requiredPlaceholders Optional array of placeholders that must be filled
 * @returns The template with placeholders replaced with random values
 */
export function fillTemplateWithRandomValues(
  template: string,
  requiredPlaceholders?: string[],
): string {
  let filledTemplate = template;

  // Find all placeholders in the template
  const placeholderRegex = /{([^}]+)}/g;
  const matches = [...template.matchAll(placeholderRegex)];

  // Replace each placeholder with a random value
  for (const match of matches) {
    const placeholder = match[1];
    const value = getRandomPlaceholderValue(placeholder);

    // Skip if required placeholder has no value
    if (requiredPlaceholders?.includes(placeholder) && !value) {
      return '';
    }

    if (value) {
      filledTemplate = filledTemplate.replace(`{${placeholder}}`, value);
    }
  }

  return filledTemplate;
}
