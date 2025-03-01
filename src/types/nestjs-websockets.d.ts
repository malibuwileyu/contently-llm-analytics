declare module '@nestjs/websockets' {
  import { Socket } from 'socket.io';

  export interface WsResponse<T> {
    event: string;
    data: T;
  }

  export interface WebSocketGateway {
    afterInit?: () => void;
    handleConnection?: (client: Socket) => void;
    handleDisconnect?: (client: Socket) => void;
  }

  export const WebSocketGateway: (options?: WebSocketOptions) => ClassDecorator;
  export const WebSocketServer: () => PropertyDecorator;
  export const _SubscribeMessage: (message: string) => MethodDecorator;
  export const _ConnectedSocket: () => ParameterDecorator;
  export const _MessageBody: () => ParameterDecorator;

  export interface OnGatewayConnection {
    handleConnection(client: Socket): void;
  }

  export interface OnGatewayDisconnect {
    handleDisconnect(client: Socket): void;
  }

  export class WsException extends Error {
    constructor(message: string | object);
  }

  export interface WebSocketOptions {
    namespace?: string;
    cors?:
      | boolean
      | {
          _origin: string | string[];
          credentials?: boolean;
        };
  }

  export interface WebSocketServer {
    emit<T>(event: string, data: T): boolean;
  }
}
