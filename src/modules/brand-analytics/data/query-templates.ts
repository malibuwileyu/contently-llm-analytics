/**
 * Query templates for generating questions about business categories and competitors
 * Templates contain placeholders that can be replaced with specific values
 */

export interface QueryTemplateData {
  template: string;
  type:
    | 'general'
    | 'comparison'
    | 'recommendation'
    | 'feature'
    | 'price'
    | 'location';
  placeholders?: Record<string, string[]>;
  requiredPlaceholders?: string[];
  priority?: number;
}

/**
 * General question templates
 */
export const generalTemplates: QueryTemplateData[] = [
  {
    template: 'What is the best {category}?',
    type: 'general',
    requiredPlaceholders: ['category'],
    priority: 5,
  },
  {
    template: 'Which {category} brands are most popular?',
    type: 'general',
    requiredPlaceholders: ['category'],
    priority: 4,
  },
  {
    template: 'What should I look for when buying {category}?',
    type: 'general',
    requiredPlaceholders: ['category'],
    priority: 3,
  },
  {
    template: 'What are the top {category} brands in {year}?',
    type: 'general',
    requiredPlaceholders: ['category', 'year'],
    placeholders: {
      year: ['2023', '2024'],
    },
    priority: 3,
  },
  {
    template: 'Which {category} are trending right now?',
    type: 'general',
    requiredPlaceholders: ['category'],
    priority: 4,
  },
];

/**
 * Comparison question templates
 */
export const comparisonTemplates: QueryTemplateData[] = [
  {
    template: 'How does {brand1} compare to {brand2} for {category}?',
    type: 'comparison',
    requiredPlaceholders: ['brand1', 'brand2', 'category'],
    priority: 5,
  },
  {
    template: "What's better, {brand1} or {brand2} for {category}?",
    type: 'comparison',
    requiredPlaceholders: ['brand1', 'brand2', 'category'],
    priority: 4,
  },
  {
    template: 'Compare {brand1} vs {brand2} {category}',
    type: 'comparison',
    requiredPlaceholders: ['brand1', 'brand2', 'category'],
    priority: 5,
  },
  {
    template:
      'What are the main differences between {brand1} and {brand2} {category}?',
    type: 'comparison',
    requiredPlaceholders: ['brand1', 'brand2', 'category'],
    priority: 3,
  },
  {
    template: 'Is {brand1} better than {brand2} for {feature} in {category}?',
    type: 'comparison',
    requiredPlaceholders: ['brand1', 'brand2', 'feature', 'category'],
    priority: 3,
  },
];

/**
 * Recommendation question templates
 */
export const recommendationTemplates: QueryTemplateData[] = [
  {
    template: 'Recommend a {category} for {use_case}',
    type: 'recommendation',
    requiredPlaceholders: ['category', 'use_case'],
    priority: 5,
  },
  {
    template: "What's the best {category} for {use_case}?",
    type: 'recommendation',
    requiredPlaceholders: ['category', 'use_case'],
    priority: 4,
  },
  {
    template: 'Which {category} should I buy for {use_case}?',
    type: 'recommendation',
    requiredPlaceholders: ['category', 'use_case'],
    priority: 4,
  },
  {
    template:
      'What {category} would you recommend for someone who {user_profile}?',
    type: 'recommendation',
    requiredPlaceholders: ['category', 'user_profile'],
    priority: 3,
  },
  {
    template: 'I need a {category} for {use_case}, what do you recommend?',
    type: 'recommendation',
    requiredPlaceholders: ['category', 'use_case'],
    priority: 3,
  },
];

/**
 * Feature-specific question templates
 */
export const featureTemplates: QueryTemplateData[] = [
  {
    template: 'Which {category} has the best {feature}?',
    type: 'feature',
    requiredPlaceholders: ['category', 'feature'],
    priority: 5,
  },
  {
    template: 'What {category} is known for {feature}?',
    type: 'feature',
    requiredPlaceholders: ['category', 'feature'],
    priority: 4,
  },
  {
    template: 'Does {brand} have good {feature} in their {category}?',
    type: 'feature',
    requiredPlaceholders: ['brand', 'feature', 'category'],
    priority: 3,
  },
  {
    template: 'Which {category} brand focuses most on {feature}?',
    type: 'feature',
    requiredPlaceholders: ['category', 'feature'],
    priority: 4,
  },
  {
    template: "What makes {brand}'s {feature} better in their {category}?",
    type: 'feature',
    requiredPlaceholders: ['brand', 'feature', 'category'],
    priority: 3,
  },
];

/**
 * Price-related question templates
 */
export const priceTemplates: QueryTemplateData[] = [
  {
    template: "What's the best value {category}?",
    type: 'price',
    requiredPlaceholders: ['category'],
    priority: 5,
  },
  {
    template: "What's a good budget {category}?",
    type: 'price',
    requiredPlaceholders: ['category'],
    priority: 4,
  },
  {
    template: 'Are {brand} {category} worth the price?',
    type: 'price',
    requiredPlaceholders: ['brand', 'category'],
    priority: 4,
  },
  {
    template: "What's the price range for {brand} {category}?",
    type: 'price',
    requiredPlaceholders: ['brand', 'category'],
    priority: 3,
  },
  {
    template: 'Which {category} offers the best bang for your buck?',
    type: 'price',
    requiredPlaceholders: ['category'],
    priority: 4,
  },
];

/**
 * Location-specific question templates
 */
export const locationTemplates: QueryTemplateData[] = [
  {
    template: 'Where can I buy {brand} in {location}?',
    type: 'location',
    requiredPlaceholders: ['brand', 'location'],
    priority: 5,
  },
  {
    template: 'Does {brand} sell {category} in {location}?',
    type: 'location',
    requiredPlaceholders: ['brand', 'category', 'location'],
    priority: 4,
  },
  {
    template: "What's the best store for {category} in {location}?",
    type: 'location',
    requiredPlaceholders: ['category', 'location'],
    priority: 4,
  },
  {
    template: 'Where can I find {brand} {category} on sale in {location}?',
    type: 'location',
    requiredPlaceholders: ['brand', 'category', 'location'],
    priority: 3,
  },
  {
    template: 'Are there any {brand} outlet stores in {location}?',
    type: 'location',
    requiredPlaceholders: ['brand', 'location'],
    priority: 3,
  },
];

/**
 * All query templates combined
 */
export const allQueryTemplates: QueryTemplateData[] = [
  ...generalTemplates,
  ...comparisonTemplates,
  ...recommendationTemplates,
  ...featureTemplates,
  ...priceTemplates,
  ...locationTemplates,
];
