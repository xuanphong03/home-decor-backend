import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway(3002, {
  namespace: '/chats',
  cors: '*',
})
export class ChatsGateway {
  constructor(private readonly chatsService: ChatsService) {}

  @WebSocketServer()
  private server: Server;

  // Lắng nghe sự kiện "sendMessage"
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Lưu tin nhắn vào database
    const message = await this.chatsService.createMessage(data);
    // Gửi tin nhắn mới cho tất cả các client trong phòng (conversationId)
    this.server
      .to(`conversation-${data.conversationName}`)
      .emit('receiveMessage', message);
    return message;
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody() data: { conversationName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationName } = data;
    client.join(`conversation-${conversationName}`);
    console.log(`Client ${client.id} joined conversation ${conversationName}`);
  }

  // Xử lý khi WebSocket được khởi tạo
  afterInit(client: Socket) {
    console.log('WebSocket server initialized');
  }

  // Xử lý khi một client kết nối
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Xử lý khi một client ngắt kết nối
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
