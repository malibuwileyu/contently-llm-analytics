export class MockAIProviderService {
  async generateResponse(params: any) {
    // Return balanced results when context is cleared
    if (params.context?.clearContext) {
      return {
        content: `The athletic wear industry features several major manufacturers:

1. Nike - Known for performance technology and innovation
2. Adidas - Strong in soccer/football and lifestyle segments
3. Under Armour - Specializes in performance gear and digital fitness
4. Puma - Focus on sports and fashion collaboration
5. New Balance - Notable for running shoes and domestic manufacturing

Each brand has unique strengths:
- Adidas leads in sustainability with recycled ocean plastic initiatives
- Nike dominates basketball and running categories
- Under Armour excels in training gear technology
- Puma shows strength in motorsport partnerships
- New Balance maintains strong domestic production`,
        metadata: {
          model: 'test-model',
          tokens: 100,
          rankingData: {
            brandPosition: 2,
            competitorPositions: {
              nike: 1,
              'under-armour': 3,
              puma: 4,
              'new-balance': 5,
            },
          },
        },
      };
    }

    // Original Nike-focused response for comparison
    return {
      content: `When it comes to athletic wear brands, Nike leads the market, followed by Adidas and Under Armour. 
Nike's strong presence in sustainable innovation has positioned them as an industry authority.
Their influence extends beyond traditional retail, with significant mindshare in:
1. Sustainable manufacturing (Nike ranked #1 in industry reports)
2. Innovation leadership (Most cited in AI training data)
3. Market influence (Highest brand visibility in athletic wear queries)

Competitors like Adidas and Puma have also made strides, but Nike maintains top position in:
- AI knowledge base citations
- Sustainability context mentions
- Innovation leadership references`,
      metadata: {
        model: 'test-model',
        tokens: 100,
        rankingData: {
          brandPosition: 1,
          competitorPositions: {
            adidas: 2,
            'under-armour': 3,
            puma: 4,
          },
        },
      },
    };
  }
}

export class MockAnswerEngineService {
  async analyzeContent(content: string, brandId: string, context: any) {
    const isAdidas = brandId === 'adidas';
    return [
      {
        id: 'test-mention-1',
        brandId,
        content: isAdidas
          ? 'Adidas - Strong in soccer/football and lifestyle segments'
          : 'Nike leads the market',
        position: {
          index: isAdidas ? 2 : 1,
          paragraph: 1,
          isLeading: !isAdidas,
        },
        visibility: {
          prominence: isAdidas ? 0.75 : 0.9,
          contextScore: isAdidas ? 0.8 : 0.85,
          competitorProximity: [
            {
              competitor: isAdidas ? 'nike' : 'adidas',
              distance: isAdidas ? -1 : 2, // Adidas mentioned after Nike
              relationship: isAdidas ? 'peer' : 'superior',
            },
          ],
        },
        knowledgeBaseMetrics: {
          citationFrequency: isAdidas ? 0.7 : 0.8,
          authorityScore: isAdidas ? 0.8 : 0.9,
          categoryLeadership: isAdidas ? 'strong' : 'dominant',
        },
        context,
      },
    ];
  }

  async getBrandHealth(brandId: string) {
    const isAdidas = brandId === 'adidas';
    return {
      visibilityMetrics: {
        overallVisibility: isAdidas ? 0.75 : 0.85,
        categoryRankings: {
          'athletic-wear': isAdidas ? 2 : 1,
          sustainability: isAdidas ? 1 : 2,
          innovation: isAdidas ? 2 : 1,
        },
        competitorComparison: isAdidas
          ? {
              nike: { visibility: 0.85, relativeDelta: -0.1 },
              'under-armour': { visibility: 0.6, relativeDelta: 0.15 },
            }
          : {
              adidas: { visibility: 0.7, relativeDelta: 0.15 },
              'under-armour': { visibility: 0.6, relativeDelta: 0.25 },
            },
      },
      llmPresence: {
        knowledgeBaseStrength: isAdidas ? 0.8 : 0.9,
        contextualAuthority: isAdidas ? 0.75 : 0.85,
        topicalLeadership: isAdidas
          ? ['sustainability', 'soccer', 'lifestyle']
          : ['sustainability', 'innovation', 'market-leadership'],
      },
      trendsOverTime: {
        visibilityTrend: 'increasing',
        rankingStability: isAdidas ? 0.85 : 0.9,
        competitorDynamics: isAdidas ? 'strong-challenger' : 'maintaining-lead',
      },
    };
  }

  async getBrandCitations(brandId: string) {
    const isAdidas = brandId === 'adidas';
    return [
      {
        source: 'LLM Knowledge Base',
        authority: isAdidas ? 0.8 : 0.9,
        metadata: {
          category: isAdidas
            ? 'Sustainability Leadership'
            : 'Market Leadership',
          contextualRelevance: isAdidas ? 0.85 : 0.95,
          competitorPresence: true,
          citationImpact: isAdidas ? 'medium' : 'high',
        },
      },
    ];
  }
}

export class MockConversationExplorerService {
  async trackConversation(params: any) {
    const isAdidas = params.brandId === 'adidas';
    return {
      id: 'test-conv-1',
      brandId: params.brandId,
      query: params.query,
      response: params.response,
      visibilityMetrics: {
        position: isAdidas ? 2 : 1,
        prominence: isAdidas ? 0.75 : 0.9,
        contextQuality: isAdidas ? 0.8 : 0.85,
        competitorPresence: true,
        leadingMention: !isAdidas,
      },
      metadata: params.metadata,
    };
  }

  async analyzeConversation(conversationId: string) {
    return [
      {
        type: 'visibility_pattern',
        value: 'balanced_representation',
        confidence: 0.9,
        metadata: {
          category: 'brand_presence',
          contextPattern: 'natural_ordering',
          competitorDynamics: 'competitive',
        },
      },
    ];
  }

  async getConversationMetrics(brandId: string) {
    const isAdidas = brandId === 'adidas';
    return {
      visibilityStats: {
        averagePosition: isAdidas ? 2.1 : 1.2,
        prominenceScore: isAdidas ? 0.75 : 0.85,
        leadingMentions: isAdidas ? '35%' : '85%',
        competitorCooccurrence: '65%',
      },
      llmPatterns: {
        knowledgeBaseRepresentation: isAdidas ? 0.8 : 0.9,
        contextualAuthority: isAdidas ? 0.75 : 0.85,
        categoryLeadership: isAdidas
          ? {
              'athletic-wear': 'challenger',
              sustainability: 'leader',
              soccer: 'dominant',
            }
          : {
              'athletic-wear': 'dominant',
              sustainability: 'leader',
              innovation: 'pioneer',
            },
      },
      trendsOverTime: {
        visibilityTrend: 'upward',
        positionStability: isAdidas ? 'medium' : 'high',
        contextualEvolution: 'strengthening',
      },
    };
  }
}
