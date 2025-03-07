export enum QueryType {
  INDUSTRY = 'industry',
  CONTEXT = 'context',
  COMPETITIVE = 'competitive',
  FREEFORM = 'freeform'
}

export enum QueryIntent {
  DISCOVERY = 'discovery',
  PRESENCE = 'presence',
  AUTHORITY = 'authority',
  DIFFERENTIATION = 'differentiation',
  IMPACT = 'impact',
  SENTIMENT = 'sentiment',
  COMPETITIVE_POSITION = 'competitive_position',
  MARKET_SHARE = 'market_share',
  TECHNOLOGY = 'technology',
  IMPLEMENTATION = 'implementation'
}

export interface ValidationRule {
  type: 'required_variable' | 'forbidden_phrase' | 'min_length' | 'max_length' | 'pattern';
  value: string | number | RegExp;
  message: string;
}

export interface ResponseValidation {
  requiredElements: Array<{
    type: 'fact' | 'comparison' | 'metric' | 'example' | 'reference';
    description: string;
  }>;
  forbiddenElements: Array<{
    type: 'speculation' | 'opinion' | 'future_tense' | 'promotional';
    pattern: RegExp;
    message: string;
  }>;
  qualityChecks: Array<{
    type: 'specificity' | 'objectivity' | 'relevance';
    validator: (text: string) => boolean;
    message: string;
  }>;
}

export interface QueryTemplate {
  type: QueryType;
  intent: QueryIntent;
  template: string;
  variables: string[];
  validationRules: ValidationRule[];
  responseValidation: ResponseValidation;
}

export interface QueryConfig {
  industryQueriesCount: number;
  contextQueriesCount: number;
  competitiveQueriesCount: number;
}

export interface QueryResult {
  type: QueryType;
  query: string;
  response: string;
  metrics: QueryMetrics;
}

export interface QueryMetrics {
  mention_count: number;
  prominence_score: number;
  sentiment_score: number;
  relevance_score: number;
  context_score: number;
}

export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ResponseValidationResult {
  isValid: boolean;
  errors: string[];
  qualityScore: number;
  metrics: {
    specificity: number;
    objectivity: number;
    relevance: number;
  };
} 