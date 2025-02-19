import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/db/prisma.service';

import { AtStrategy } from 'src/strategies';
import { PermissionsService } from '../permissions/permissions.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, AtStrategy, PermissionsService],
})
export class UsersModule {}
