import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LocationUpdate } from 'shared-types';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private logger = new Logger('RealtimeGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToTrip')
  handleSubscribe(client: Socket, tripId: string) {
    client.join(`trip_${tripId}`);
    this.logger.log(`Client ${client.id} joined room trip_${tripId}`);
  }

  broadcastLocation(update: LocationUpdate) {
    this.server.to(`trip_${update.tripId}`).emit('locationUpdate', update);
  }
}
