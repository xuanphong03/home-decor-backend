import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueName } from 'src/app.interface';
import { contactAdmin } from './utils/mail';

@Processor(QueueName.EMAIL)
export class EmailConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    await this.contact(
      job.data.name,
      job.data.email,
      job.data.phoneNumber,
      job.data.subject,
      job.data.message,
    );
    return {};
  }

  contact(
    name: string,
    email: string,
    phoneNumber: string,
    subject: string,
    message: string,
  ) {
    return contactAdmin(name, email, phoneNumber, subject, message);
  }
}
