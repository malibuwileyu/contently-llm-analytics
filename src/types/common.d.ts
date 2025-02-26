import { Request } from 'express';

export type UnknownRecord = Record<string, unknown>;

export interface ExtendedRequest extends Request {
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

export type ErrorDetails = {
  message: string;
  code?: string;
  details?: UnknownRecord;
};

export type ValidationResult = {
  isValid: boolean;
  errors?: ErrorDetails[];
};

export type MetricsData = {
  name: string;
  value: number;
  labels?: UnknownRecord;
};

export type CacheValue = string | number | boolean | object | null;

export type WebSocketMessage = {
  event: string;
  data: unknown;
};
