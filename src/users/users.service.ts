import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../auth/dto/login.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(loginDto: LoginDto) {
    const hashedPassword = await bcrypt.hash(loginDto.password, 10);

    const roleMap: Record<string, UserRole> = {
      admin: UserRole.ADMIN,
      никита: UserRole.NIKITA,
      nikita: UserRole.NIKITA,
    };

    const role: UserRole = roleMap[loginDto.username.toLowerCase()] || UserRole.SURVIVOR;

    return this.prisma.user.create({
      data: {
        username: loginDto.username,
        password: hashedPassword,
        role,
      },
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
