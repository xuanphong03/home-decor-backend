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
// import { contactAdmin } from './utils/mail';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return 'Home Decor Api';
  }

  @Post('/contact')
  async contact(@Body() body: ContactFormDto, @Res() res: Response) {
    const { name, email, subject, message, phoneNumber } = body;
    if (!email || !subject || !message || !name || !phoneNumber) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
      });
    }

    try {
      await this.appService.contactAdmin(body);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Email đã được gửi tới admin',
      });
    } catch (error) {
      console.error('Error contacting admin:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
      });
    }
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
