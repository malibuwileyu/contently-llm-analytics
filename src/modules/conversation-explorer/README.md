# Conversation Explorer Module

## Overview

The Conversation Explorer module provides a comprehensive solution for analyzing, indexing, and extracting insights from conversations between users and AI assistants. It enables brands to understand user intents, sentiment, topics, and actions across conversations, helping them improve their AI assistants and user experience.

## Features

- **Conversation Analysis**: Extract intents, sentiment, topics, and actions from conversations
- **Insight Indexing**: Store and index conversation insights for efficient retrieval
- **Trend Analysis**: Identify top intents, topics, engagement trends, and common actions
- **Search Capabilities**: Search for specific insights across conversations
- **REST API & GraphQL**: Access all functionality through both REST and GraphQL interfaces

## Architecture

The module follows a clean, modular architecture with the following components:

### Entities
- `Conversation`: Represents a conversation with messages, metadata, and engagement metrics
- `ConversationInsight`: Represents an insight extracted from a conversation (intent, sentiment, topic, action)

### Repositories
- `ConversationRepository`: Manages conversation data storage and retrieval
- `ConversationInsightRepository`: Manages insight data storage and retrieval

### Services
- `ConversationAnalyzerService`: Analyzes conversations to extract insights
- `ConversationIndexerService`: Indexes conversations and insights for search
- `ConversationExplorerService`: Orchestrates analysis, indexing, and trend extraction

### Controllers & Resolvers
- `ConversationExplorerController`: REST API endpoints
- `ConversationExplorerResolver`: GraphQL queries and mutations

## API Reference

### REST API

#### Analyze Conversation
```
POST /api/conversation-explorer/analyze
```
Analyzes a conversation and extracts insights.

#### Get Conversation
```
GET /api/conversation-explorer/conversations/:id
```
Retrieves a specific conversation with its insights.

#### Get Conversations
```
GET /api/conversation-explorer/conversations?brandId=:brandId&limit=:limit&offset=:offset
```
Retrieves conversations for a specific brand.

#### Get Conversation Trends
```
GET /api/conversation-explorer/trends?brandId=:brandId&startDate=:startDate&endDate=:endDate
```
Retrieves trends from conversations for a specific brand.

#### Search Insights
```
POST /api/conversation-explorer/insights/search
```
Searches for insights across conversations.

### GraphQL API

#### Queries
```graphql
# Get a conversation by ID
conversation(id: ID!): Conversation

# Get conversations by brand ID
conversations(brandId: ID!, limit: Int, offset: Int): [Conversation!]!

# Get conversation trends
conversationTrends(brandId: ID!, options: TrendOptionsInput): ConversationTrends!

# Search for insights
searchInsights(options: InsightSearchOptionsInput!): [InsightSearchResult!]!
```

#### Mutations
```graphql
# Analyze a conversation
analyzeConversation(input: AnalyzeConversationInput!): Conversation!
```

## Usage Examples

### Analyzing a Conversation

```typescript
// REST API
const response = await fetch('/api/conversation-explorer/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    brandId: 'brand-123',
    messages: [
      { role: 'user', content: 'Hello, I need help with my account', timestamp: new Date() },
      { role: 'assistant', content: 'I\'d be happy to help with your account. What seems to be the issue?', timestamp: new Date() },
    ],
    metadata: {
      platform: 'web',
      context: 'support',
      tags: ['account', 'help'],
    },
  }),
});

const analyzedConversation = await response.json();
```

```graphql
# GraphQL
mutation {
  analyzeConversation(input: {
    brandId: "brand-123",
    messages: [
      { role: "user", content: "Hello, I need help with my account", timestamp: "2023-06-01T12:00:00Z" },
      { role: "assistant", content: "I'd be happy to help with your account. What seems to be the issue?", timestamp: "2023-06-01T12:00:05Z" }
    ],
    metadata: {
      platform: "web",
      context: "support",
      tags: ["account", "help"]
    }
  }) {
    id
    engagementScore
    insights {
      type
      category
      confidence
    }
  }
}
```

### Getting Conversation Trends

```typescript
// REST API
const response = await fetch('/api/conversation-explorer/trends?brandId=brand-123&startDate=2023-01-01&endDate=2023-01-31');
const trends = await response.json();
```

```graphql
# GraphQL
query {
  conversationTrends(
    brandId: "brand-123", 
    options: { 
      startDate: "2023-01-01T00:00:00Z", 
      endDate: "2023-01-31T23:59:59Z" 
    }
  ) {
    topIntents {
      category
      count
      averageConfidence
    }
    topTopics {
      name
      count
      averageRelevance
    }
    engagementTrends {
      date
      averageEngagement
    }
    commonActions {
      type
      count
      averageConfidence
    }
  }
}
```

## Database Schema

The module uses two main tables:

### conversations
- `id`: UUID primary key
- `brand_id`: UUID foreign key to brands
- `messages`: JSONB array of message objects
- `metadata`: JSONB object with conversation metadata
- `engagement_score`: FLOAT engagement score (0-1)
- `analyzed_at`: TIMESTAMP when the conversation was analyzed
- `created_at`: TIMESTAMP creation date
- `updated_at`: TIMESTAMP last update date

### conversation_insights
- `id`: UUID primary key
- `conversation_id`: UUID foreign key to conversations
- `type`: VARCHAR insight type (intent, sentiment, topic, action)
- `category`: VARCHAR insight category
- `confidence`: FLOAT confidence score (0-1)
- `details`: JSONB object with additional insight details
- `created_at`: TIMESTAMP creation date
- `updated_at`: TIMESTAMP last update date

## Dependencies

- NestJS framework
- TypeORM for database operations
- GraphQL for API
- Natural language processing service for conversation analysis
- Search service for indexing and searching insights

## Configuration

The module can be configured through environment variables:

```
# NLP Service Configuration
NLP_SERVICE_URL=http://nlp-service:3000
NLP_SERVICE_API_KEY=your-api-key

# Search Service Configuration
SEARCH_SERVICE_URL=http://search-service:9200
SEARCH_SERVICE_INDEX=conversation-insights

# Cache Configuration
CACHE_TTL=900 # 15 minutes in seconds
```

## Testing

The module includes comprehensive unit tests for all components. Run tests with:

```bash
npm run test -- conversation-explorer
```

## Contributing

When contributing to this module, please follow these guidelines:

1. Follow the file structure and naming conventions
2. Keep files under 250 lines for better AI context
3. Add appropriate tests for new features
4. Document new APIs in the README
5. Use the provided interfaces and DTOs for type safety 