import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { AtStrategy } from 'src/strategies';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  providers: [ChatsService, ChatsGateway, AtStrategy, PrismaService],
  exports: [ChatsService],
})
export class ChatsModule {}
