import { Injectable } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  getHello(): string {
    return 'Hello World!';
  }
  async getReceivers(userId: number) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    return this.prisma.user.findMany({
      where: {
        isSupport: !user.isSupport,
        isAdmin: user.isSupport ? false : true,
      },
    });
  }

  async getMessages(senderId: number, receiverId: number) {
    const user = await this.prisma.user.findFirst({ where: { id: senderId } });
    return this.prisma.conversation.findFirst({
      where: {
        userId: user.isSupport ? receiverId : senderId,
        supportId: user.isSupport ? senderId : receiverId,
      },
      include: {
        messages: true,
      },
    });
  }
}
