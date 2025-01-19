import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo tin nhắn mới
  async createMessage(body: CreateMessageDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: body.senderId },
    });
    const dataGetConversation: any = {};
    dataGetConversation.conversationName = body.conversationName;
    if (user.isSupport) {
      dataGetConversation.userId = body.receiverId;
      dataGetConversation.supportId = body.senderId;
    } else {
      dataGetConversation.userId = body.senderId;
      dataGetConversation.supportId = body.receiverId;
    }

    const conversation =
      await this.createOrGetConversation(dataGetConversation);

    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: body.senderId,
        content: body.content,
      },
      include: {
        sender: true, // Lấy thêm thông tin người gửi
      },
    });
  }

  // Lấy tất cả tin nhắn trong một cuộc hội thoại
  async getMessages(conversationId: number) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: true,
      },
    });
  }

  // Kiểm tra và tạo cuộc hội thoại nếu chưa tồn tại
  async createOrGetConversation(data: {
    conversationName: string;
    supportId: number;
    userId: number;
  }) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        name: data.conversationName,
        supportId: data.supportId,
        userId: data.userId,
      },
      include: { user: true, supporter: true },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          name: data.conversationName,
          supportId: data.supportId,
          userId: data.userId,
        },
        include: { supporter: true, user: true },
      });
    }
    return conversation;
  }

  async getMessagesByConversation(conversationName: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { name: conversationName },
      include: { messages: true },
    });
    return conversation.messages;
  }
}
