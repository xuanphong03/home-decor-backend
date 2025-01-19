import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { redis } from 'src/utils/redis';

type JwtPayload = {
  userId: number;
  email: string;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_AT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const accessToken = req.get('authorization')?.split(' ')[1];
    const redisStore = await redis;
    const blacklist = await redisStore.get(`blacklist_${accessToken}`);
    if (blacklist) {
      return false;
    }
    return {
      ...payload,
      accessToken,
    };
  }
}
