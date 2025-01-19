import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { contactAdmin } from './utils/mail';
import { AuthGuard } from '@nestjs/passport';
import { ChatsService } from './modules/chats/chats.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly chatsService: ChatsService,
  ) {}

  @Post('/contact')
  async contactMe(@Body() body: ContactFormDto, @Res() res: Response) {
    const { email, subject, message } = body;
    await contactAdmin(email, subject, message);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
    });
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('/chat/conversations')
  async getConversations(@Req() req, @Res() res: Response) {
    const { userId } = req.user;
    const receivers = await this.appService.getReceivers(+userId);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: receivers,
    });
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('/chat/messages')
  async getChatMessages(
    @Req() req,
    @Query('id') id: string,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const data = await this.appService.getMessages(+userId, +id);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: data ? data.messages : [],
    });
  }
}
