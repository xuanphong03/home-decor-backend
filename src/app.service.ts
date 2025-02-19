import { Injectable } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { QueueName, QueueTask } from './app.interface';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ContactFormDto } from './dto/contact-form.dto';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.EMAIL) private emailQueue: Queue,
  ) {}
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

  async contactAdmin(body: ContactFormDto) {
    await this.emailQueue.add(
      QueueTask.CONTACT_ADMIN,
      {
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        subject: body.subject,
        message: body.message,
      },
      {
        delay: 3000, // Thời gian delay giữa các job
        attempts: 3, // Số lần thử nếu job failed
        backoff: 3000, // Thời gian chờ của mỗi lần chạy lại
      },
    );
  }

  async sendOrderConfirmation(
    userId: number,
    totalPrice: number,
    products: { name: string; quantity: number; price: number }[],
  ) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    console.log('Send email');
    await this.emailQueue.add(
      QueueTask.ORDER_CONFIRMATION,
      {
        email: user.email,
        subject: 'Xác nhận đơn hàng',
        name: user.name,
        totalPrice: totalPrice,
        products: products,
      },
      {
        delay: 3000, // Thời gian delay giữa các job
        attempts: 3, // Số lần thử nếu job failed
        backoff: 3000, // Thời gian chờ của mỗi lần chạy lại
      },
    );
  }
}
