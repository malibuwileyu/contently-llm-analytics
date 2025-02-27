import { NLPAnalysis } from '../../interfaces/conversation-analysis.interface';

export class MockNLPService {
  async analyzeConversation(messages: any[]): Promise<NLPAnalysis> {
    return {
      intents: [
        { 
          category: 'help_request', 
          confidence: 0.85,
          context: { relevance: 0.9 }
        }
      ],
      sentiment: { 
        score: 0.6, 
        magnitude: 0.8 
      },
      topics: [
        { 
          name: 'account', 
          relevance: 0.9 
        }
      ],
      actions: [
        { 
          type: 'request_info', 
          confidence: 0.75 
        }
      ],
    };
  }
} 