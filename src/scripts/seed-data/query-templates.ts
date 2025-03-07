import { QueryType } from '../../analytics/types/query.types';

export interface QueryTemplate {
  type: QueryType;
  intent: QueryIntent;
  template: string;
  variables: string[];
  validationRules: ValidationRule[];
  responseValidation: ResponseValidation;
}

export type QueryIntent = 
  | 'discovery'
  | 'presence'
  | 'authority'
  | 'differentiation'
  | 'impact'
  | 'sentiment'
  | 'competitive_position'
  | 'market_share'
  | 'technology'
  | 'implementation';

interface ValidationRule {
  type: 'required_variable' | 'forbidden_phrase' | 'min_length' | 'max_length' | 'pattern';
  value: string | number | RegExp;
  message: string;
}

interface ResponseValidation {
  requiredElements: {
    type: 'fact' | 'comparison' | 'metric' | 'example' | 'reference';
    description: string;
  }[];
  forbiddenElements: {
    type: 'speculation' | 'opinion' | 'future_tense' | 'promotional';
    pattern: RegExp;
    message: string;
  }[];
  qualityChecks: {
    type: 'specificity' | 'objectivity' | 'relevance';
    validator: (response: string) => boolean;
    message: string;
  }[];
}

export const queryTemplates: QueryTemplate[] = [
  // Industry Queries
  {
    type: 'industry',
    intent: 'discovery',
    template: 'Who are the leading providers of {solution_type} in {industry}?',
    variables: ['solution_type', 'industry'],
    validationRules: [
      {
        type: 'required_variable',
        value: 'solution_type',
        message: 'Solution type must be specified'
      },
      {
        type: 'forbidden_phrase',
        value: 'innovative',
        message: 'Avoid subjective terms like innovative'
      }
    ],
    responseValidation: {
      requiredElements: [
        {
          type: 'fact',
          description: 'Must contain specific company names and their offerings'
        },
        {
          type: 'metric',
          description: 'Should include market presence indicators'
        }
      ],
      forbiddenElements: [
        {
          type: 'speculation',
          pattern: /\b(might|could|maybe|possibly|potentially)\b/i,
          message: 'Response contains speculative language'
        },
        {
          type: 'future_tense',
          pattern: /\b(will|going to|planning to|intends to)\b/i,
          message: 'Response discusses future plans instead of current state'
        }
      ],
      qualityChecks: [
        {
          type: 'specificity',
          validator: (response) => {
            const companyMentions = response.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g);
            return companyMentions ? companyMentions.length >= 2 : false;
          },
          message: 'Response must mention at least 2 specific companies'
        }
      ]
    }
  },
  {
    type: 'industry',
    intent: 'presence',
    template: 'Which companies are most visible in {solution_type} market?',
    variables: ['solution_type'],
    validationRules: [
      {
        type: 'pattern',
        value: /market|industry|space|sector/,
        message: 'Query must reference market context'
      }
    ],
    responseValidation: {
      requiredElements: [
        {
          type: 'comparison',
          description: 'Must compare market presence of multiple companies'
        }
      ],
      forbiddenElements: [
        {
          type: 'promotional',
          pattern: /\b(best|leading|innovative|revolutionary)\b/i,
          message: 'Response contains promotional language'
        }
      ],
      qualityChecks: [
        {
          type: 'objectivity',
          validator: (response) => {
            const subjectiveTerms = /\b(great|amazing|excellent|innovative)\b/i;
            return !subjectiveTerms.test(response);
          },
          message: 'Response must maintain objectivity'
        }
      ]
    }
  },

  // Context Queries
  {
    type: 'context',
    intent: 'differentiation',
    template: 'How does {company_name} differentiate its {product/service} through {approach} to serve {target_segment}?',
    variables: ['company_name', 'product/service', 'approach', 'target_segment'],
    validationRules: [
      {
        type: 'required_variable',
        value: 'company_name',
        message: 'Company name must be specified'
      }
    ],
    responseValidation: {
      requiredElements: [
        {
          type: 'fact',
          description: 'Must contain specific differentiating features'
        },
        {
          type: 'example',
          description: 'Should include concrete examples'
        }
      ],
      forbiddenElements: [
        {
          type: 'opinion',
          pattern: /\b(I think|probably|seems|appears)\b/i,
          message: 'Response contains subjective opinions'
        }
      ],
      qualityChecks: [
        {
          type: 'relevance',
          validator: (response) => {
            return response.toLowerCase().includes('differentiat');
          },
          message: 'Response must address differentiation'
        }
      ]
    }
  },

  // Competitive Queries
  {
    type: 'competitive',
    intent: 'competitive_position',
    template: 'Compare {company_name} with other {solution_type} providers in terms of {aspect}',
    variables: ['company_name', 'solution_type', 'aspect'],
    validationRules: [
      {
        type: 'min_length',
        value: 3,
        message: 'Must have at least 3 comparison points'
      }
    ],
    responseValidation: {
      requiredElements: [
        {
          type: 'comparison',
          description: 'Must directly compare with competitors'
        },
        {
          type: 'reference',
          description: 'Should reference specific capabilities or features'
        }
      ],
      forbiddenElements: [
        {
          type: 'speculation',
          pattern: /\b(might|could|probably)\b/i,
          message: 'Response contains speculative comparisons'
        }
      ],
      qualityChecks: [
        {
          type: 'specificity',
          validator: (response) => {
            const competitors = response.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g);
            return competitors ? competitors.length >= 3 : false;
          },
          message: 'Response must mention at least 3 competitors'
        }
      ]
    }
  }
]; 