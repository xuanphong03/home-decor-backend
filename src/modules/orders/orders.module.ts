import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';
import { PermissionsService } from '../admin/permissions/permissions.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PrismaService,
    AtStrategy,
    PermissionsService,
    ProductsService,
    UsersService,
  ],
})
export class OrdersModule {}
