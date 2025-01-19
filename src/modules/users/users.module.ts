import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/db/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, RtStrategy } from 'src/strategies';

@Module({
  imports: [JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, AtStrategy, RtStrategy],
})
export class UsersModule {}
