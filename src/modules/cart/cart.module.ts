import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService, AtStrategy],
})
export class CartModule {}
