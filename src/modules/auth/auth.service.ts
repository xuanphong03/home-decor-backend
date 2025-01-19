import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/db/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import Hash from 'src/utils/hashing';
import { ProfileDto } from './dto/profile.dto';
import { redis } from 'src/utils/redis';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
  ) {}

  async getAccessToken(userId: number, email: string) {
    const accessToken = await this.jwt.signAsync(
      { userId, email },
      {
        secret: process.env.JWT_AT_SECRET,
        expiresIn: process.env.JWT_AT_EXPIRE,
      },
    );
    return accessToken;
  }

  async getRefreshToken(userId: number, email: string) {
    const refreshToken = await this.jwt.signAsync(
      { userId, email },
      {
        secret: process.env.JWT_RT_SECRET,
        expiresIn: process.env.JWT_RT_EXPIRE,
      },
    );
    return refreshToken;
  }

  async register(body: RegisterDto) {
    body.password = Hash.make(body.password);
    const user = await this.prisma.user.create({ data: body });
    const accessToken = await this.getAccessToken(user.id, user.email);
    const refreshToken = await this.getRefreshToken(user.id, user.email);
    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async validateUser({ email, password }: LoginDto) {
    const user = await this.userService.findUserByField('email', email);
    if (!user) {
      return null;
    }
    const status = Hash.verify(password, user.password);
    if (!status) {
      return null;
    }
    const accessToken = await this.getAccessToken(user.id, user.email);
    const refreshToken = await this.getRefreshToken(user.id, user.email);
    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(userId: number, email: string) {
    const accessToken = await this.getAccessToken(+userId, email);
    return { accessToken };
  }

  async updateProfile(userId: number, body: ProfileDto) {
    delete body.email;
    body.updatedAt = new Date();
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...body },
    });
  }

  async changePassword(email: string, newPassword: string) {
    const updatedData: any = {};
    updatedData.password = Hash.make(newPassword);
    updatedData.updatedAt = new Date();
    return this.prisma.user.update({
      where: {
        email: email,
      },
      data: { ...updatedData },
    });
  }

  async logout(expToken: number, token: string) {
    const ttl = expToken - Math.floor(Date.now() / 1000);
    const redisStore = await redis;
    await redisStore.set(`blacklist_${token}`, 1, {
      EX: ttl,
    });
  }
}
