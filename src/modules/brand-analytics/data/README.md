# Brand Analytics Seed Data

This directory contains seed data for the Brand Analytics module. The data is used for testing, development, and demonstration purposes.

## Data Files

- **business-categories.ts**: Contains seed data for business categories, including hierarchical relationships between categories.
- **competitors.ts**: Contains seed data for competitors organized by business category.
- **query-templates.ts**: Contains templates for generating queries about business categories and competitors.
- **placeholder-values.ts**: Contains values that can be used to replace placeholders in query templates.
- **generated-queries.ts**: Contains pre-generated queries based on templates and placeholder values.
- **customer-profiles.ts**: Contains customer profiles for personalized query generation.
- **index.ts**: Exports all seed data for easy access.

## Data Structure

### Business Categories

Business categories are organized in a hierarchical structure with parent-child relationships. Each category includes:

- Name
- Description
- Keywords
- Synonyms
- Subcategories (optional)

### Competitors

Competitors are organized by business category. Each competitor includes:

- Name
- Description
- Website
- Business Category
- Market Share (optional)
- Founded Year (optional)
- Headquarters (optional)
- Key Products (optional)
- Social Media Links (optional)

### Query Templates

Query templates are used to generate questions about business categories and competitors. Each template includes:

- Template text with placeholders
- Type (general, comparison, recommendation, feature, price, location)
- Required placeholders
- Priority

### Placeholder Values

Placeholder values are used to replace placeholders in query templates. Each placeholder category includes:

- Name
- Values

### Generated Queries

Generated queries are pre-generated questions based on templates and placeholder values. Each query includes:

- ID
- Text
- Type
- Business Category (optional)
- Competitors (optional)
- Features (optional)
- Created Date

### Customer Profiles

Customer profiles are used for personalized query generation. Each profile includes:

- ID
- Name
- Age (optional)
- Gender (optional)
- Location (optional)
- Occupation (optional)
- Interests
- Purchase History (optional)
- Search History (optional)
- Persona
- Budget (optional)

## Usage

To use the seed data in your code:

```typescript
import { 
  businessCategories,
  competitors,
  allQueryTemplates,
  placeholderValues,
  generatedQueries,
  customerProfiles
} from './data';
```

To seed the database with this data:

```bash
npm run seed:brand-analytics
```

## Helper Functions

The data files include helper functions for working with the seed data:

- **getFlattenedBusinessCategories()**: Returns a flattened array of business categories with parent references.
- **getAllCompetitors()**: Returns a flat array of all competitors across all categories.
- **getCompetitorsByCategory(category)**: Returns competitors for a specific business category.
- **getPlaceholderValues(placeholder)**: Returns all values for a specific placeholder.
- **getRandomPlaceholderValue(placeholder)**: Returns a random value for a specific placeholder.
- **fillTemplateWithRandomValues(template, requiredPlaceholders)**: Fills a template with random values for all placeholders.
- **getCustomerById(id)**: Returns a customer profile by ID.
- **getCustomersByInterest(category, interestLevel)**: Returns customer profiles interested in a specific category.
- **generatePersonalizedQueries(customerId, count)**: Generates personalized queries for a customer based on their profile. 