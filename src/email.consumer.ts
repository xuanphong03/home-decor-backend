import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueName, QueueTask } from 'src/app.interface';
import { confirmOrder, contactAdmin } from './utils/mail';

@Processor(QueueName.EMAIL)
export class EmailConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log('Processing job:', job.name);
    switch (job.name) {
      case QueueTask.CONTACT_ADMIN:
        await this.sendContactEmailToAdmin(
          job.data.name,
          job.data.email,
          job.data.phoneNumber,
          job.data.subject,
          job.data.message,
        );
        return {};
      case QueueTask.ORDER_CONFIRMATION:
        await this.sendOrderConfirmationEmailToClient(
          job.data.email,
          job.data.subject,
          job.data.name,
          job.data.totalPrice,
          job.data.products,
        );
        return {};
      default:
        throw new Error('Invalid job name');
    }
  }

  async sendContactEmailToAdmin(
    name: string,
    email: string,
    phoneNumber: string,
    subject: string,
    message: string,
  ) {
    return contactAdmin(name, email, phoneNumber, subject, message);
  }

  async sendOrderConfirmationEmailToClient(
    email: string,
    subject: string,
    name: string,
    totalPrice: number,
    products: { name: string; quantity: number; price: number }[],
  ) {
    return confirmOrder(email, subject, name, totalPrice, products);
  }
}
