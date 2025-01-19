import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/db/prisma.service';

import { AtStrategy } from 'src/strategies';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, AtStrategy],
})
export class UsersModule {}
