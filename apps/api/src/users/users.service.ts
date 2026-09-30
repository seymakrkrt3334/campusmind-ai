import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma-errors';

export type CreateUserInput = {
  email?: string;
  name?: string;
  role?: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput) {
    const email = input.email?.trim();
    if (!email) {
      throw new BadRequestException('email is required');
    }

    if (input.role !== undefined && !isUserRole(input.role)) {
      throw new BadRequestException(
        'role must be STUDENT, INSTRUCTOR, or ADMIN',
      );
    }

    try {
      return await this.prisma.user.create({
        data: {
          email,
          name: input.name,
          role: input.role,
        },
      });
    } catch (error) {
      mapPrismaError(error, 'A user with this email already exists');
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}
