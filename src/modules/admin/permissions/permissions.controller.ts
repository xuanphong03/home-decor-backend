import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  getPermissionList() {
    return this.permissionsService.getPermissionList();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/user')
  getPermissionsByUser(@Req() req) {
    const id = req.user.userId;
    return this.permissionsService.getAllPermissionsByUser(+id);
  }
}
