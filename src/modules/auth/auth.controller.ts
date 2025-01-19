import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { sendEmail } from 'src/utils/mail';
import { redis } from 'src/utils/redis';
import { z } from 'zod';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { LoginDto } from './dto/login.dto';
import { ProfileDto } from './dto/profile.dto';
import { RegisterDto } from './dto/register.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventName } from 'src/app.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('/register')
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const schema = z.object({
      name: z
        .string({
          required_error: 'Tên bắt buộc phải nhập',
        })
        .min(4, 'Tên phải chứa ít nhất 4 ký tự'),
      email: z
        .string({
          required_error: 'Email bắt buộc phải nhập',
        })
        .email('Email không đúng định dạng')
        .refine(async (email) => {
          const user = await this.userService.findUserByField('email', email);
          return !user;
        }, 'Email đã có người sử dụng'),
      password: z
        .string({
          required_error: 'Mật khẩu bắt buộc phải nhập',
        })
        .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
    });
    // Xử lý validate body (nếu schema sử dụng async => schema.safeParseAsync(body))
    const validatedFields = await schema.safeParseAsync(body);
    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors;
      const errorMessage = errors[Object.keys(errors)[0]][0];
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: errorMessage,
      });
    }
    const data = await this.authService.register(body);
    if (!data) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Đăng ký tài khoản thất bại',
      });
    }
    this.eventEmitter.emit(EventName.USER_CREATED, { id: data.user.id });
    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: data,
    });
  }

  @Post('/login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const dataLogin = await this.authService.validateUser(body);
    if (!dataLogin) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email hoặc mật khẩu chưa chính xác',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: dataLogin,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  async logout(@Req() req, @Res() res: Response) {
    const { exp, accessToken } = req.user;
    await this.authService.logout(+exp, accessToken);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/profile')
  async me(@Req() req, @Res() res: Response) {
    const payload = req.user;
    const user = await this.userService.findUserByField('id', payload.userId);
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'FAILED',
      });
    }
    delete user.password;
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/profile')
  async updateProfile(
    @Req() req,
    @Body() body: ProfileDto,
    @Res() res: Response,
  ) {
    const payload = req.user;
    const user = await this.authService.updateProfile(payload.userId, body);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }

  @UseGuards(AuthGuard('jwt-rt'))
  @Post('/refreshToken')
  async refreshToken(@Req() req, @Res() res: Response) {
    const user = req.user;
    const data = await this.authService.refreshToken(user.userId, user.email);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: { ...data, refreshToken: user.refreshToken },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/active')
  async getActiveCode(@Req() req, @Res() res: Response) {
    const payload = req.user;
    const email = payload?.email;
    const user = await this.userService.findUserByField('email', email);
    if (!user) {
      return res.status(HttpStatus.CREATED).json({
        success: false,
        message: 'Email không tồn tại trong database',
      });
    }
    const activeCode = Math.floor(100000 + Math.random() * 900000).toString();
    await sendEmail(
      email,
      'Kích hoạt tài khoản',
      `Mã kích hoạt tài khoản của bạn là ${activeCode}. Mã này chỉ có hiệu lực trong 2 phút`,
    );
    const redisStore = await redis;
    const redisActiveCode = await redisStore.get(`activeCode_${email}`);
    // Nếu đã tồn tại active code thì xóa đi
    if (redisActiveCode) {
      await redisStore.del(`activeCode_${email}`);
    }
    await redisStore.set(`activeCode_${email}`, activeCode, { EX: 120 });
    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'SUCCESS',
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/active')
  async confirmActiveCode(
    @Req() req,
    @Body() { activeCode },
    @Res() res: Response,
  ) {
    const payload = req.user;
    const email = payload?.email;
    const redisStore = await redis;
    const redisActiveCode = await redisStore.get(`activeCode_${email}`);
    if (redisActiveCode !== activeCode) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: 'Mã kích hoạt không hợp lệ' });
    }
    await redisStore.del(`activeCode_${email}`);
    const user = await this.userService.activateUser(payload.userId);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Xác minh tài khoản thành công',
      data: user,
    });
  }

  @Get('/forgot-password')
  async getAccountVerifyCode(@Query() query, @Res() res: Response) {
    const schema = z.object({
      email: z
        .string({
          required_error: 'Email bắt buộc phải nhập',
        })
        .email('Email không đúng định dạng')
        .refine(async (email) => {
          const user = await this.userService.findUserByField('email', email);
          return user;
        }, 'Email chưa được đăng ký'),
    });
    const validatedFields = await schema.safeParseAsync(query);
    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors;
      const errorMessage = errors[Object.keys(errors)[0]][0];
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: errorMessage,
      });
    }
    const { email } = query;
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    await sendEmail(
      email,
      'Quên mật khẩu',
      `Mã xác minh tài khoản của bạn là ${verificationCode}. Mã này chỉ có hiệu lực trong 2 phút`,
    );
    const redisStore = await redis;
    const redisVerificationCode = await redisStore.get(
      `verificationCode_${email}`,
    );
    // Nếu đã tồn tại active code thì xóa đi
    if (redisVerificationCode) {
      await redisStore.del(`verificationCode_${email}`);
    }
    await redisStore.set(`verificationCode_${email}`, verificationCode, {
      EX: 10000,
    });
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
    });
  }

  @Post('/forgot-password')
  async verifyAccount(
    @Body() { verificationCode, email },
    @Res() res: Response,
  ) {
    const redisStore = await redis;
    const redisVerificationCode = await redisStore.get(
      `verificationCode_${email}`,
    );
    if (redisVerificationCode !== verificationCode) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: 'Mã xác minh không hợp lệ' });
    }
    await redisStore.del(`verificationCode_${email}`);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Xác minh tài khoản thành công',
    });
  }

  @Patch('/reset-password')
  async resetPassword(@Body() body, @Res() res: Response) {
    const user = await this.authService.changePassword(
      body.email,
      body.password,
    );
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/change-password')
  async changePassword(
    @Req() req,
    @Body() body: ChangePasswordDto,
    @Res() res: Response,
  ) {
    const payload = req.user;
    const { currentPassword, newPassword } = body;
    const status = await this.authService.validateUser({
      email: payload.email,
      password: currentPassword,
    });
    if (!status) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'ERROR',
      });
    }
    const user = await this.authService.changePassword(
      payload.email,
      newPassword,
    );
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }
}
