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
      orderBy: { [sort]: order },
      where: { ...filter, isRoot: false },
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
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
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

  async updateUserPermissions(id: number, body: any) {
    const permissionsFromBody = await Promise.all(
      body.map(async (permissionName: string) => {
        let permission = await this.prisma.permission.findFirst({
          where: { name: permissionName },
        });
        if (!permission) {
          permission = await this.prisma.permission.create({
            data: { name: permissionName, status: true },
          });
        }
        return {
          createdAt: new Date(),
          updatedAt: new Date(),
          permission: {
            connect: {
              id: permission.id,
            },
          },
        };
      }),
    );
    return this.prisma.user.update({
      where: { id },
      data: {
        permissions: {
          deleteMany: {},
          create: permissionsFromBody,
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
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

  updateUserById(id: number, body: any) {
    const updateData: any = {};
    updateData.isAdmin = body.isAdmin ? true : false;
    updateData.isSupport = body.isSupport ? true : false;
    updateData.updatedAt = new Date();
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: { permission: true },
        },
        roles: {
          include: { role: true },
        },
      },
    });
  }
}
