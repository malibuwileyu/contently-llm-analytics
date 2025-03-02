import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../../../supabase/supabase.service';
import { Logger } from '@nestjs/common';

// Create a custom decorator to replace SubscribeMessage
function SubscribeMessage(message: string): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata('socket_message', message, descriptor.value);
    return descriptor;
  };
}

interface AnalyticsSubscription {
  brandId: string;
}

@WebSocketGateway({
  cors: {
    _origin: process.env.CLIENT_URL || '*',
    credentials: true,
  },
  namespace: 'analytics',
})
export class AnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new WsException('No authentication token provided');
      }

      const user = await this.supabaseService.verifyToken(token);
      client.data.user = user;

      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client _disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToAnalytics')
  handleSubscribeToAnalytics(
    client: Socket,
    payload: AnalyticsSubscription,
  ): void {
    const room = `analytics:${payload.brandId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  @SubscribeMessage('unsubscribeFromAnalytics')
  handleUnsubscribeFromAnalytics(
    client: Socket,
    payload: AnalyticsSubscription,
  ): void {
    const room = `analytics:${payload.brandId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  async broadcastAnalyticsUpdate(
    brandId: string,
    data: unknown,
  ): Promise<void> {
    const room = `analytics:${brandId}`;
    this.server.to(room).emit('analyticsUpdate', data);
    this.logger.debug(`Broadcasting analytics update to ${room}`);
  }
}
