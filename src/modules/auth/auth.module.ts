import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/db/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy, RtStrategy } from 'src/strategies';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, UsersService, PrismaService, AtStrategy, RtStrategy],
})
export class AuthModule {}
