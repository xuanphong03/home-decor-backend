import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  getRoles() {
    return this.prisma.role.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async validateSupperRole(roleId: number) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
      },
    });
    if (!role) {
      throw new BadRequestException('Vai trò không tồn tại');
    }
    return role.isSuper;
  }

  async createRole(body: any) {
    const existingRole = await this.prisma.role.findFirst({
      where: { name: body.name },
    });
    if (existingRole) {
      throw new ConflictException('Vai trò này đã tồn tại');
    }
    const permissionFromBody = await Promise.all(
      body.permissions.map(async (permissionName: string) => {
        let permission = await this.prisma.permission.findFirst({
          where: { name: permissionName },
        });
        if (!permission) {
          permission = await this.prisma.permission.create({
            data: {
              name: permissionName,
              status: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        return {
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
          permission: {
            connect: {
              id: +permission.id,
            },
          },
        };
      }),
    );
    return this.prisma.role.create({
      data: {
        name: body.name,
        status: body.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: { create: permissionFromBody },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  getRoleById(id: number) {
    return this.prisma.role.findFirst({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async updateRole(id: number, body: any) {
    let permissionFromBody = null;
    const role = await this.prisma.role.findFirst({
      where: { name: body.name },
    });

    // Nếu đã tồn tại 1 role có tên trùng vói tên trong body => error
    if (role && role.id !== id) {
      throw new ConflictException('Tên vai trò đã tồn tại.');
    }

    const isSupper = await this.validateSupperRole(id);
    if (isSupper) {
      throw new BadRequestException(`Vai trò này không được phép thay đổi`);
    }
    if (
      body.permissions &&
      Array.isArray(body.permissions) &&
      body.permissions.length
    ) {
      permissionFromBody = await Promise.all(
        body.permissions.map(async (permissionName: string) => {
          let permission = await this.prisma.permission.findFirst({
            where: { name: permissionName },
          });
          if (!permission) {
            permission = await this.prisma.permission.create({
              data: {
                name: permissionName,
                status: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }
          return {
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
            permission: {
              connect: {
                id: +permission.id,
              },
            },
          };
        }),
      );
    }

    const dataUpdate: any = {
      updatedAt: new Date(),
    };
    if (body.name) {
      dataUpdate.name = body.name;
    }
    dataUpdate.status = body.status ? true : false;
    if (permissionFromBody) {
      dataUpdate.permissions = {
        deleteMany: {},
        create: permissionFromBody,
      };
    }
    return this.prisma.role.update({
      where: { id },
      data: dataUpdate,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async deleteRole(id: number) {
    await this.prisma.role.update({
      where: { id },
      data: {
        permissions: {
          deleteMany: {},
        },
      },
    });
    return this.prisma.role.delete({ where: { id } });
  }

  findRoleByName(name: string) {
    return this.prisma.role.findFirst({ where: { name } });
  }
}
