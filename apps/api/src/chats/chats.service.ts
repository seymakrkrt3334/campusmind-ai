import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma-errors';

export type CreateChatInput = {
  userId?: string;
  courseId?: string;
  title?: string;
};

export type CreateMessageInput = {
  role?: MessageRole;
  content?: string;
};

const sessionInclude = {
  user: {
    select: { id: true, email: true, name: true },
  },
  course: {
    select: { id: true, code: true, title: true },
  },
} as const;

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateChatInput) {
    if (!input.userId) {
      throw new BadRequestException('userId is required');
    }

    await this.assertUserExists(input.userId);
    if (input.courseId) {
      await this.assertCourseExists(input.courseId);
    }

    try {
      return await this.prisma.chatSession.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          title: input.title,
        },
        include: sessionInclude,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async findOne(id: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  async findByUser(userId: string) {
    await this.assertUserExists(userId);

    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: sessionInclude,
    });
  }

  async addMessage(chatId: string, input: CreateMessageInput) {
    const content = input.content?.trim();
    if (!input.role || !isMessageRole(input.role)) {
      throw new BadRequestException('role must be USER, ASSISTANT, or SYSTEM');
    }
    if (!content) {
      throw new BadRequestException('content is required');
    }

    await this.findOne(chatId);

    try {
      return await this.prisma.message.create({
        data: {
          chatSessionId: chatId,
          role: input.role,
          content,
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async listMessages(chatId: string) {
    await this.findOne(chatId);

    return this.prisma.message.findMany({
      where: { chatSessionId: chatId },
      orderBy: { createdAt: 'asc' },
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

  private async assertCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }
}

function isMessageRole(value: string): value is MessageRole {
  return Object.values(MessageRole).includes(value as MessageRole);
}
