import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  findUserByField(field: string, value: string) {
    return this.prisma.user.findFirst({
      where: {
        [field]: value,
      },
      include: { address: true },
    });
  }

  activateUser(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        verify: new Date(),
      },
    });
  }
  async checkUserStatus(userId: number) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    return user.verify;
  }
}
