import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule as ClientUsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RolesModule } from './modules/admin/roles/roles.module';
import { UsersModule as AdminUsersModule } from './modules/admin/users/users.module';
import { PermissionsModule } from './modules/admin/permissions/permissions.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { OrdersModule as AdminOrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrdersModule as ClientOrdersModule } from './modules/client/orders/orders.module';
import { PrismaService } from './db/prisma.service';
import { ChatsModule } from './modules/chats/chats.module';
import { AtStrategy } from './strategies';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from './app.interface';
import { EmailConsumer } from './email.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({}),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'http://api.homedecor-nxp.site',
        port: 6379,
      },
    }),
    BullModule.registerQueue({ name: QueueName.EMAIL }),
    AuthModule,
    ClientUsersModule,
    ProfileModule,
    RolesModule,
    AdminUsersModule,
    PermissionsModule,
    ProductsModule,
    CategoriesModule,
    PaymentMethodsModule,
    AdminOrdersModule,
    CartModule,
    ClientOrdersModule,
    ChatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, AtStrategy, EmailConsumer],
})
export class AppModule {}
