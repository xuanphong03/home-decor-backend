import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getProfile(@Req() req, @Res() res: Response) {
    const { userId } = req.user;
    const user = await this.profileService.getProfile(userId);
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'FAILED',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Req() req,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const updatedUser = await this.profileService.updateProfile(userId, body);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: updatedUser,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/address')
  async deleteAddress(@Query() query, @Req() req, @Res() res: Response) {
    const { id } = query;
    const { userId } = req.user;
    const updatedUser = await this.profileService.deleteAddress(+userId, +id);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: updatedUser,
    });
  }
}
