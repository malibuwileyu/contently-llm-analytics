export interface QueryAnalysis {
  query: string;
  response: {
    content: string;
    metadata: Record<string, any>;
  };
  analysis: {
    content: string;
    metadata: Record<string, any>;
  };
}

export interface TestResults {
  timestamp: string;
  brandName: string;
  queries: QueryAnalysis[];
} 