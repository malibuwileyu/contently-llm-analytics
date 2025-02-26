import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

interface AnalyticsSubscription {
  brandId: string;
  metrics?: string[];
}

@WebSocketGateway({
  namespace: 'analytics',
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
@UseGuards(JwtAuthGuard)
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private subscriptions = new Map<string, Set<string>>();

  async handleConnection(client: Socket): Promise<void> {
    // Client connection is already authenticated by JwtAuthGuard
    const userId = client.data.user.id;
    this.subscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket): void {
    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribeToAnalytics')
  handleSubscribeToAnalytics(
    client: Socket,
    payload: AnalyticsSubscription
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
    payload: AnalyticsSubscription
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
    data: any,
    metrics?: string[]
  ): Promise<void> {
    const room = `analytics:${brandId}`;
    
    // If specific metrics are provided, only send those
    const update = metrics ? 
      this.filterMetrics(data, metrics) : 
      data;

    this.server.to(room).emit('analyticsUpdate', {
      brandId,
      timestamp: new Date(),
      data: update
    });
  }

  // Helper to filter metrics based on subscription
  private filterMetrics(data: any, metrics: string[]): any {
    return Object.keys(data)
      .filter(key => metrics.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {} as any);
  }
} 