import { PubSubEngine } from 'graphql-subscriptions';

declare module 'graphql-subscriptions' {
  export class PubSub implements PubSubEngine {
    publish(triggerName: string, payload: any): Promise<void>;
    subscribe(triggerName: string, onMessage: Function, options?: Object): Promise<number>;
    unsubscribe(subId: number): void;
    asyncIterator<T = any>(triggers: string | string[]): AsyncIterator<T>;
  }
} 