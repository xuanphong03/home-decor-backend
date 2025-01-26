import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';
import { PermissionsService } from '../admin/permissions/permissions.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, AtStrategy, PermissionsService],
})
export class CategoriesModule {}
