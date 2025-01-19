import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';
import { UsersService as ClientUsersService } from 'src/modules/users/users.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, AtStrategy, ClientUsersService],
})
export class OrdersModule {}
