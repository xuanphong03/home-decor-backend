import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getPermissionsByUser(id: number) {
    return this.prisma.user.findFirst({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getPermissionByUserRole(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const permissions = [];
    if (user.roles.length > 0) {
      user.roles.forEach(({ role }) => {
        if (role.permissions.length > 0) {
          role.permissions.forEach(({ permission }) => {
            if (!permissions.includes(permission.name)) {
              permissions.push(permission.name);
            }
          });
        }
      });
    }
    return permissions;
  }

  async getAllPermissionsByUser(id: number) {
    const permissions = [];
    const permissionByRole = await this.getPermissionByUserRole(+id);
    const userByPermission = await this.getPermissionsByUser(+id);
    if (userByPermission.permissions.length) {
      userByPermission.permissions.forEach(({ permission }) => {
        if (!permissions.includes(permission.name)) {
          permissions.push(permission.name);
        }
      });
    }
    if (permissionByRole.length) {
      permissionByRole.forEach((permission) => {
        if (!permissions.includes(permission)) {
          permissions.push(permission);
        }
      });
    }
    return permissions;
  }

  getPermissionList() {
    return this.prisma.permission.findMany();
  }

  async validatePermission(userId: number, permissionName: string) {
    const permissionByRole = await this.prisma.usersOnRoles.findFirst({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    if (
      !permissionByRole?.role ||
      !permissionByRole?.role?.permissions?.length
    ) {
      return null;
    }
    const validPermission = permissionByRole.role.permissions.find(
      ({ permission }) => permission.name === permissionName,
    );
    if (!validPermission) return null;
    return permissionByRole;
  }
}
