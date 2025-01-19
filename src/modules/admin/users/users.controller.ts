import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('')
  async getUserList(@Query() query, @Res() res: Response) {
    const { q, _page = 1, _limit = 3, _order = 'asc', _sort = 'id' } = query;
    const filter = {} as {
      [key: string]: string | boolean | object | number;
    };
    if (q) {
      filter.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const { total, users } = await this.usersService.getUserList({
      page: +_page,
      limit: +_limit,
      sort: _sort,
      order: _order,
      filter,
    });
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: {
        total,
        users,
        currentPage: +_page,
      },
    });
  }

  @Get(':id')
  async getUserDetail(@Param('id') id: string, @Res() res: Response) {
    const user = await this.usersService.getUserById(+id);
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }

  @Get(':id/roles')
  getRolesByUserId(@Param('id') id: number) {
    return this.usersService.getRoleByUser(+id);
  }

  @Put(':id/roles')
  async updateUserRoles(
    @Param('id') id: number,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!body || !Array.isArray(body) || !body.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Role is required',
      });
    }
    const user = await this.usersService.updateUserRoles(+id, body);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }

  @Delete(':id/roles')
  deleteUserRoles(@Param('id') id: number) {
    return this.usersService.deleteUserRoles(+id);
  }

  @Get(':id/permissions')
  getPermissionsByUser(@Param('id') id: number) {
    return this.usersService.getPermissionsByUser(+id);
  }

  @Put(':id/permissions')
  async updateUserPermissions(
    @Param('id') id: number,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!body || !Array.isArray(body) || !body.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Permissions is required',
      });
    }
    const user = await this.usersService.updateUserPermissions(+id, body);
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCCESS',
      data: user,
    });
  }

  @Delete(':id/permissions')
  deleteUserPermissions(@Param('id') id: number) {
    return this.usersService.deleteUserPermissions(+id);
  }
}
