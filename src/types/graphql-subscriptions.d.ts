declare module 'graphql-subscriptions' {
  export interface PubSubEngine {
    publish<TPayload extends Record<string, unknown>>(
      triggerName: string,
      payload: TPayload,
    ): Promise<void>;

    subscribe<TPayload extends Record<string, unknown>>(
      triggerName: string,
      onMessage: (payload: TPayload) => void,
      options?: Record<string, unknown>,
    ): Promise<number>;

    unsubscribe(subId: number): void;

    asyncIterator<TPayload extends Record<string, unknown>>(
      triggers: string | string[],
    ): AsyncIterator<TPayload>;
  }

  export class PubSub implements PubSubEngine {
    constructor();
    publish<TPayload extends Record<string, unknown>>(
      triggerName: string,
      payload: TPayload,
    ): Promise<void>;
    subscribe<TPayload extends Record<string, unknown>>(
      triggerName: string,
      onMessage: (payload: TPayload) => void,
      options?: Record<string, unknown>,
    ): Promise<number>;
    unsubscribe(subId: number): void;
    asyncIterator<TPayload extends Record<string, unknown>>(
      triggers: string | string[],
    ): AsyncIterator<TPayload>;
  }

  export type PubSubConstructor = new () => PubSubEngine;
  export const PubSub: PubSubConstructor;
}
