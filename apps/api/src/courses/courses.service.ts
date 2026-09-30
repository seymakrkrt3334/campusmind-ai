import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseMembershipRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma-errors';

export type CreateCourseInput = {
  code?: string;
  title?: string;
  description?: string;
};

export type AddCourseMemberInput = {
  userId?: string;
  role?: CourseMembershipRole;
};

const memberUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCourseInput) {
    const code = input.code?.trim();
    const title = input.title?.trim();

    if (!code) {
      throw new BadRequestException('code is required');
    }
    if (!title) {
      throw new BadRequestException('title is required');
    }

    try {
      return await this.prisma.course.create({
        data: {
          code,
          title,
          description: input.description,
        },
      });
    } catch (error) {
      mapPrismaError(error, 'A course with this code already exists');
    }
  }

  findAll() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async addMember(courseId: string, input: AddCourseMemberInput) {
    if (!input.userId) {
      throw new BadRequestException('userId is required');
    }
    if (!input.role || !isMembershipRole(input.role)) {
      throw new BadRequestException('role must be STUDENT or INSTRUCTOR');
    }

    await this.findOne(courseId);
    await this.assertUserExists(input.userId);

    const existing = await this.prisma.courseMember.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this course');
    }

    try {
      return await this.prisma.courseMember.create({
        data: {
          courseId,
          userId: input.userId,
          role: input.role,
        },
        include: {
          user: { select: memberUserSelect },
        },
      });
    } catch (error) {
      mapPrismaError(error, 'User is already a member of this course');
    }
  }

  async listMembers(courseId: string) {
    await this.findOne(courseId);

    return this.prisma.courseMember.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: memberUserSelect },
      },
    });
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}

function isMembershipRole(value: string): value is CourseMembershipRole {
  return Object.values(CourseMembershipRole).includes(
    value as CourseMembershipRole,
  );
}
