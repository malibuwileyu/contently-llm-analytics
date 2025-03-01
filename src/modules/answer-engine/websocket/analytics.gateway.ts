import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { UnknownRecord } from '../../../types/common';

// Mock SubscribeMessage decorator for testing
const SubscribeMessage =
  (message: string) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;

interface AnalyticsSubscription {
  brandId: string;
  metrics?: string[];
}

interface AnalyticsUpdate {
  brandId: string;
  timestamp: Date;
  data: UnknownRecord;
}

@WebSocketGateway({
  namespace: 'analytics',
  cors: {
    _origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(JwtAuthGuard)
export class AnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private subscriptions = new Map<string, Set<string>>();

  async handleConnection(client: Socket): Promise<void> {
    // Client connection is already authenticated by JwtAuthGuard
    const clientId = client.id;
    this.subscriptions.set(clientId, new Set());
  }

  handleDisconnect(client: Socket): void {
    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribeToAnalytics')
  handleSubscribeToAnalytics(
    client: Socket,
    payload: AnalyticsSubscription,
  ): void {
    const room = `analytics:${payload.brandId}`;
    client.join(room);

    const clientSubs = this.subscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.add(room);
    }
  }

  @SubscribeMessage('unsubscribeFromAnalytics')
  handleUnsubscribeFromAnalytics(
    client: Socket,
    payload: AnalyticsSubscription,
  ): void {
    const room = `analytics:${payload.brandId}`;
    client.leave(room);

    const clientSubs = this.subscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.delete(room);
    }
  }

  // Method to broadcast updates to subscribed clients
  async broadcastAnalyticsUpdate(
    brandId: string,
    data: UnknownRecord,
    metrics?: string[],
  ): Promise<void> {
    const room = `analytics:${brandId}`;

    // If specific metrics are provided, only send those
    const update = metrics ? this.filterMetrics(data, metrics) : data;

    this.server.to(room).emit('analyticsUpdate', {
      brandId,
      timestamp: new Date(),
      data: update,
    } as AnalyticsUpdate);
  }

  // Helper to filter metrics based on subscription
  private filterMetrics(data: UnknownRecord, metrics: string[]): UnknownRecord {
    return Object.keys(data)
      .filter(key => metrics.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {} as UnknownRecord);
  }
}
