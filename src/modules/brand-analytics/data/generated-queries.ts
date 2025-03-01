/**
 * Generated queries for testing and development
 * This file contains pre-generated queries based on templates and placeholder values
 */

import { allQueryTemplates } from './query-templates';
import { fillTemplateWithRandomValues } from './placeholder-values';

export interface GeneratedQuery {
  id: string;
  text: string;
  type: string;
  businessCategory?: string;
  competitors?: string[];
  features?: string[];
  createdAt: Date;
}

/**
 * Generate a unique ID for a query
 * @returns A unique ID string
 */
function generateQueryId(): string {
  return `query_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Extract business category from query text
 * @param queryText The query text
 * @returns The extracted business category or undefined
 */
function extractBusinessCategory(queryText: string): string | undefined {
  const categoryPatterns = [
    /running shoes/i,
    /basketball shoes/i,
    /cross-training shoes/i,
    /athletic shoes/i,
    /sports shoes/i,
    /sneakers/i,
    /athletic tops/i,
    /athletic bottoms/i,
    /sportswear/i,
    /athletic wear/i,
    /fitness equipment/i,
    /cardio equipment/i,
    /strength training equipment/i,
    /yoga equipment/i,
    /smartphones/i,
    /iPhones/i,
    /Android phones/i,
    /budget phones/i,
  ];

  for (const pattern of categoryPatterns) {
    if (pattern.test(queryText)) {
      const match = queryText.match(pattern);
      if (match) return match[0];
    }
  }

  return undefined;
}

/**
 * Extract competitors from query text
 * @param queryText The query text
 * @returns Array of extracted competitors
 */
function extractCompetitors(queryText: string): string[] {
  const competitorPatterns = [
    /Nike/i,
    /Adidas/i,
    /New Balance/i,
    /Under Armour/i,
    /Brooks/i,
    /ASICS/i,
    /Hoka One One/i,
    /Lululemon/i,
    /Puma/i,
    /Gymshark/i,
    /Peloton/i,
    /NordicTrack/i,
    /Bowflex/i,
    /Amazon/i,
    /Walmart/i,
    /Shopify/i,
    /Apple/i,
    /Samsung/i,
    /Google/i,
  ];

  const competitors: string[] = [];

  for (const pattern of competitorPatterns) {
    if (pattern.test(queryText)) {
      const match = queryText.match(pattern);
      if (match && !competitors.includes(match[0])) {
        competitors.push(match[0]);
      }
    }
  }

  return competitors;
}

/**
 * Extract features from query text
 * @param queryText The query text
 * @returns Array of extracted features
 */
function extractFeatures(queryText: string): string[] {
  const featurePatterns = [
    /comfort/i,
    /durability/i,
    /support/i,
    /cushioning/i,
    /breathability/i,
    /traction/i,
    /stability/i,
    /flexibility/i,
    /waterproofing/i,
    /lightweight design/i,
    /responsiveness/i,
    /energy return/i,
    /moisture-wicking/i,
    /compression/i,
    /stretch/i,
    /battery life/i,
    /camera quality/i,
    /processing speed/i,
    /display quality/i,
    /water resistance/i,
  ];

  const features: string[] = [];

  for (const pattern of featurePatterns) {
    if (pattern.test(queryText)) {
      const match = queryText.match(pattern);
      if (match && !features.includes(match[0])) {
        features.push(match[0]);
      }
    }
  }

  return features;
}

/**
 * Generate a query from a template
 * @returns A generated query object
 */
function generateQuery(): GeneratedQuery {
  // Select a random template
  const randomIndex = Math.floor(Math.random() * allQueryTemplates.length);
  const template = allQueryTemplates[randomIndex];

  // Fill the template with random values
  const queryText = fillTemplateWithRandomValues(
    template.template,
    template.requiredPlaceholders,
  );

  // Create the query object
  const query: GeneratedQuery = {
    id: generateQueryId(),
    text: queryText,
    type: template.type,
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    ), // Random date within last 30 days
  };

  // Extract metadata
  query.businessCategory = extractBusinessCategory(queryText);
  query.competitors = extractCompetitors(queryText);
  query.features = extractFeatures(queryText);

  return query;
}

/**
 * Generate a specified number of queries
 * @param count Number of queries to generate
 * @returns Array of generated queries
 */
function generateQueries(count: number): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];

  for (let i = 0; i < count; i++) {
    const query = generateQuery();
    if (query.text) {
      // Only add if query text was successfully generated
      queries.push(query);
    }
  }

  return queries;
}

// Pre-generated queries for testing and development
export const generatedQueries: GeneratedQuery[] = [
  {
    id: 'query_1',
    text: 'What is the best running shoes?',
    type: 'general',
    businessCategory: 'running shoes',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-15T10:30:00Z'),
  },
  {
    id: 'query_2',
    text: 'How does Nike compare to Adidas for athletic shoes?',
    type: 'comparison',
    businessCategory: 'athletic shoes',
    competitors: ['Nike', 'Adidas'],
    features: [],
    createdAt: new Date('2023-12-16T14:45:00Z'),
  },
  {
    id: 'query_3',
    text: 'Recommend a fitness equipment for weightlifting',
    type: 'recommendation',
    businessCategory: 'fitness equipment',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-17T09:15:00Z'),
  },
  {
    id: 'query_4',
    text: 'Which running shoes has the best cushioning?',
    type: 'feature',
    businessCategory: 'running shoes',
    competitors: [],
    features: ['cushioning'],
    createdAt: new Date('2023-12-18T16:20:00Z'),
  },
  {
    id: 'query_5',
    text: "What's the best value athletic shoes?",
    type: 'price',
    businessCategory: 'athletic shoes',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-19T11:05:00Z'),
  },
  {
    id: 'query_6',
    text: 'Where can I buy Nike in New York?',
    type: 'location',
    businessCategory: undefined,
    competitors: ['Nike'],
    features: [],
    createdAt: new Date('2023-12-20T13:40:00Z'),
  },
  {
    id: 'query_7',
    text: 'Compare Brooks vs ASICS running shoes',
    type: 'comparison',
    businessCategory: 'running shoes',
    competitors: ['Brooks', 'ASICS'],
    features: [],
    createdAt: new Date('2023-12-21T08:25:00Z'),
  },
  {
    id: 'query_8',
    text: "What's better, Apple or Samsung for smartphones?",
    type: 'comparison',
    businessCategory: 'smartphones',
    competitors: ['Apple', 'Samsung'],
    features: [],
    createdAt: new Date('2023-12-22T15:10:00Z'),
  },
  {
    id: 'query_9',
    text: 'Which sportswear brand focuses most on sustainability?',
    type: 'feature',
    businessCategory: 'sportswear',
    competitors: [],
    features: ['sustainability'],
    createdAt: new Date('2023-12-23T12:35:00Z'),
  },
  {
    id: 'query_10',
    text: 'What should I look for when buying basketball shoes?',
    type: 'general',
    businessCategory: 'basketball shoes',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-24T09:50:00Z'),
  },
  {
    id: 'query_11',
    text: 'Are Adidas running shoes worth the price?',
    type: 'price',
    businessCategory: 'running shoes',
    competitors: ['Adidas'],
    features: [],
    createdAt: new Date('2023-12-25T14:15:00Z'),
  },
  {
    id: 'query_12',
    text: "What's the best store for fitness equipment in Chicago?",
    type: 'location',
    businessCategory: 'fitness equipment',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-26T10:30:00Z'),
  },
  {
    id: 'query_13',
    text: 'Which athletic shoes are trending right now?',
    type: 'general',
    businessCategory: 'athletic shoes',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-27T16:45:00Z'),
  },
  {
    id: 'query_14',
    text: 'What running shoes would you recommend for someone who has flat feet?',
    type: 'recommendation',
    businessCategory: 'running shoes',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-28T11:20:00Z'),
  },
  {
    id: 'query_15',
    text: 'Does Under Armour have good breathability in their sportswear?',
    type: 'feature',
    businessCategory: 'sportswear',
    competitors: ['Under Armour'],
    features: ['breathability'],
    createdAt: new Date('2023-12-29T08:55:00Z'),
  },
  {
    id: 'query_16',
    text: "What's a good budget smartphone?",
    type: 'price',
    businessCategory: 'smartphone',
    competitors: [],
    features: [],
    createdAt: new Date('2023-12-30T15:40:00Z'),
  },
  {
    id: 'query_17',
    text: 'Where can I find Nike athletic shoes on sale in Los Angeles?',
    type: 'location',
    businessCategory: 'athletic shoes',
    competitors: ['Nike'],
    features: [],
    createdAt: new Date('2023-12-31T12:05:00Z'),
  },
  {
    id: 'query_18',
    text: 'What are the main differences between Nike and New Balance running shoes?',
    type: 'comparison',
    businessCategory: 'running shoes',
    competitors: ['Nike', 'New Balance'],
    features: [],
    createdAt: new Date('2024-01-01T09:30:00Z'),
  },
  {
    id: 'query_19',
    text: 'Which fitness equipment has the best durability?',
    type: 'feature',
    businessCategory: 'fitness equipment',
    competitors: [],
    features: ['durability'],
    createdAt: new Date('2024-01-02T14:55:00Z'),
  },
  {
    id: 'query_20',
    text: 'What are the top athletic wear brands in 2024?',
    type: 'general',
    businessCategory: 'athletic wear',
    competitors: [],
    features: [],
    createdAt: new Date('2024-01-03T11:10:00Z'),
  },
];

// Generate additional queries if needed
export const additionalQueries = generateQueries(30);

// All queries combined
export const allQueries = [...generatedQueries, ...additionalQueries];
