import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma-errors';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';

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

  async create(actorId: string, input: CreateChatDto) {
    if (input.userId && input.userId !== actorId) {
      throw new ForbiddenException('You cannot create a chat for another user');
    }

    if (input.courseId) {
      await this.assertCourseExists(input.courseId);
    }

    try {
      return await this.prisma.chatSession.create({
        data: {
          userId: actorId,
          courseId: input.courseId,
          title: input.title,
        },
        include: sessionInclude,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async findOne(id: string, actorId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    if (session.userId !== actorId) {
      throw new ForbiddenException('You do not have access to this chat');
    }
    return session;
  }

  async findByUser(userId: string, actorId: string) {
    if (userId !== actorId) {
      throw new ForbiddenException('You do not have access to these chats');
    }

    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: sessionInclude,
    });
  }

  async addMessage(chatId: string, actorId: string, input: CreateMessageDto) {
    await this.findOne(chatId, actorId);

    try {
      return await this.prisma.message.create({
        data: {
          chatSessionId: chatId,
          role: input.role,
          content: input.content,
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async listMessages(chatId: string, actorId: string) {
    await this.findOne(chatId, actorId);

    return this.prisma.message.findMany({
      where: { chatSessionId: chatId },
      orderBy: { createdAt: 'asc' },
    });
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
