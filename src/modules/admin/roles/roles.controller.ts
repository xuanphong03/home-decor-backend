import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Response } from 'express';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async getRoles(@Res() res: Response) {
    const roles = await this.rolesService.getRoles();
    if (!roles) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Không có dữ liệu',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'SUCESS',
      data: roles,
    });
  }

  @Get(':id')
  getRoleById(@Param('id') id: number) {
    return this.rolesService.getRoleById(+id);
  }

  @Post()
  async createRole(
    @Body() { name, status, permissions }: any,
    @Res() res: Response,
  ) {
    let permissionData = [];
    if (!name) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Vui lòng nhập tên vai trò',
      });
    }
    if (permissions && Array.isArray(permissions)) {
      permissionData = permissions;
    }
    const role = await this.rolesService.createRole({
      name,
      status,
      permissions: permissionData,
    });
    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Thêm mới vai trò thành công',
      data: role,
    });
  }

  @Patch(':id')
  async updateRole(
    @Param('id') id: number,
    @Body() { name, status, permissions }: any,
    @Res() res: Response,
  ) {
    const updateRole = await this.rolesService.updateRole(+id, {
      name,
      status,
      permissions,
    });
    if (!updateRole) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: 'Cập nhật vai trò thất bại' });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Cập nhật vai trò thành công',
      data: updateRole,
    });
  }

  @Delete(':id')
  async removeRole(@Param('id') id: string, @Res() res: Response) {
    const isSupperRole = await this.rolesService.validateSupperRole(+id);
    if (isSupperRole) {
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message: 'Không thể xóa vai trò này',
      });
    }
    const deletedRole = await this.rolesService.deleteRole(+id);
    if (!deletedRole) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Xóa vai trò thất bại',
      });
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Xóa vai trò thành công',
      data: deletedRole,
    });
  }
}
