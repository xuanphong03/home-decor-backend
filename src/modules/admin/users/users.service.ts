import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserList({ page, limit, sort, order, filter = {} }) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.user.count();
    const users = await this.prisma.user.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      where: filter,
      include: {
        permissions: { include: { permission: true } },
        roles: { include: { role: true } },
      },
    });
    return {
      total,
      users,
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      include: {
        address: true,
        permissions: {
          include: {
            permission: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) return null;
    return user;
  }

  getRoleByUser(id: number) {
    return this.prisma.user.findFirst({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  updateUserRoles(id: number, body: any) {
    const dataUpdate = body.map((roleId: number) => {
      return {
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          connect: {
            id: roleId,
          },
        },
      };
    });

    return this.prisma.user.update({
      where: { id },
      data: {
        roles: {
          deleteMany: {},
          create: dataUpdate,
        },
      },
    });
  }

  deleteUserRoles(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        roles: {
          deleteMany: {},
        },
      },
    });
  }

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

  updateUserPermissions(id: number, body: any) {
    const dataUpdate = body.map((permissionId: number) => {
      return {
        createdAt: new Date(),
        updatedAt: new Date(),
        permission: {
          connect: {
            id: permissionId,
          },
        },
      };
    });
    return this.prisma.user.update({
      where: { id },
      data: {
        permissions: {
          deleteMany: {},
          create: dataUpdate,
        },
      },
    });
  }

  deleteUserPermissions(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        permissions: {
          deleteMany: {},
        },
      },
    });
  }
}
