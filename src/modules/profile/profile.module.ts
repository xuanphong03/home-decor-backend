import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaService } from 'src/db/prisma.service';
import { AtStrategy, RtStrategy } from 'src/strategies';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService, AtStrategy, RtStrategy],
})
export class ProfileModule {}
