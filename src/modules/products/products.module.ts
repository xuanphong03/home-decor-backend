import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';
import { PermissionsService } from '../admin/permissions/permissions.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, AtStrategy, PermissionsService],
})
export class ProductsModule {}
