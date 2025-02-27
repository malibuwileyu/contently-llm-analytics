export type UnknownRecord = Record<string, unknown>;

export type CacheValue = string | number | boolean | object | null;

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  order: 'ASC' | 'DESC';
}

export interface FilterParams {
  field: string;
  value: unknown;
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in';
} 