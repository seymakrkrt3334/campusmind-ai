import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword } from '../common/password';
import { SafeUser, safeUserSelect } from '../common/safe-user';
import { mapPrismaError } from '../common/prisma-errors';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserDto) {
    const passwordHash = await hashPassword(input.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash,
        },
        select: safeUserSelect,
      });
    } catch (error) {
      mapPrismaError(error, 'A user with this email already exists');
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: SafeUser) {
    if (actor.role !== UserRole.ADMIN && actor.id !== id) {
      throw new ForbiddenException('Insufficient role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
