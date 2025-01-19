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
  getRoles() {
    return this.rolesService.getRoles();
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
        message: 'Vui lòng nhập tên role',
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
      message: 'SUCCESS',
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
        .json({ success: false, message: 'FAILED' });
    }
    return res
      .status(HttpStatus.OK)
      .json({ success: true, message: 'SUCCESS', data: updateRole });
  }

  @Delete(':id')
  removeRole(@Param('id') id: number) {
    return this.rolesService.deleteRole(+id);
  }
}
