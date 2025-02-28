import { SearchService } from '../../services/search.service';

export class MockSearchService implements Partial<SearchService> {
  searchConversations = jest.fn();
  indexConversation = jest.fn();
  deleteConversation = jest.fn();
  updateConversation = jest.fn();
} 