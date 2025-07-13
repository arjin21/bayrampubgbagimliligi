import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private HASH_ROUNDS = 12;

  async register(data: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) throw new ConflictException('Email or username already taken');

    const hash = await bcrypt.hash(data.password, this.HASH_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: hash,
      },
    });

    const token = this.signToken(user.id, user.username);
    return { user: this.exclude(user, ['passwordHash']), accessToken: token };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.usernameOrEmail }, { username: data.usernameOrEmail }],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(data.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user.id, user.username);
    return { user: this.exclude(user, ['passwordHash']), accessToken: token };
  }

  private signToken(userId: string, username: string) {
    return this.jwt.sign({ sub: userId, username });
  }

  private exclude<T, K extends keyof T>(user: T, keys: K[]): Omit<T, K> {
    const clone = { ...user };
    for (const key of keys) delete clone[key];
    return clone;
  }
}