import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: {
        address: true,
        roles: { include: { role: true } },
        permissions: { include: { permission: true } },
      },
    });
    if (!user) return null;
    delete user.password;
    return user;
  }

  updateProfile(userId: number, body: any) {
    const dataUpdate: any = {};
    if (body.name) {
      dataUpdate.name = body.name;
    }
    if (body.imageUrl) {
      dataUpdate.imageUrl = body.imageUrl;
    }
    if (body.phoneNumber) {
      dataUpdate.phoneNumber = body.phoneNumber;
    }
    if (body.address) {
      body.address.updatedAt = new Date();
      if (body.address?.id) {
        dataUpdate.address = {
          update: {
            where: { id: body.address.id },
            data: {
              ...body.address,
            },
          },
        };
      } else {
        dataUpdate.address = {
          create: {
            ...body.address,
          },
        };
      }
    }
    body.updatedAt = new Date();
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...dataUpdate },
      include: { address: true },
    });
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId: userId, // Đảm bảo địa chỉ thuộc user
      },
    });
    if (!address) return null;
    // Xóa địa chỉ
    await this.prisma.address.delete({
      where: { id: addressId },
    });
    return this.prisma.user.update({
      where: { id: +userId },
      data: {
        updatedAt: new Date(),
      },
      include: {
        address: true,
      },
    });
  }
}
