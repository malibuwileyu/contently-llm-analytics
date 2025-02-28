import { NLPService } from '../../services/nlp.service';

export class MockNLPService implements Partial<NLPService> {
  analyzeSentiment = jest.fn();
  extractTopics = jest.fn();
  detectIntent = jest.fn();
  identifyEntities = jest.fn();
} 