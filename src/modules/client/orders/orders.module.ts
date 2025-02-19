import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';
import { UsersService as ClientUsersService } from 'src/modules/users/users.service';
import { AppService } from 'src/app.service';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from 'src/app.interface';

@Module({
  imports: [BullModule.registerQueue({ name: QueueName.EMAIL })],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PrismaService,
    AtStrategy,
    ClientUsersService,
    AppService,
  ],
})
export class OrdersModule {}
