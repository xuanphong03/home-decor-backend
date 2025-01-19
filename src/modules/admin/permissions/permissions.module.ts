import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy } from 'src/strategies';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PrismaService, AtStrategy],
})
export class PermissionsModule {}
