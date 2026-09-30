import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SafeUser } from '../common/safe-user';
import { mapPrismaError } from '../common/prisma-errors';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

const documentInclude = {
  uploadedBy: {
    select: { id: true, email: true, name: true },
  },
  course: {
    select: { id: true, code: true, title: true },
  },
} as const;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: SafeUser, input: CreateDocumentDto) {
    const uploadedById = this.resolveUploader(actor, input.uploadedById);
    await this.assertUserExists(uploadedById);
    if (input.courseId) {
      await this.assertCourseExists(input.courseId);
    }

    try {
      return await this.prisma.document.create({
        data: {
          title: input.title,
          originalFilename: input.originalFilename,
          mimeType: input.mimeType,
          uploadedById,
          courseId: input.courseId,
        },
        include: documentInclude,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  findAll() {
    return this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: documentInclude,
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: documentInclude,
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async findByCourse(courseId: string) {
    await this.assertCourseExists(courseId);

    return this.prisma.document.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: documentInclude,
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

  private resolveUploader(actor: SafeUser, uploadedById?: string) {
    if (!uploadedById || uploadedById === actor.id) {
      return actor.id;
    }
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient role');
    }
    return uploadedById;
  }
}
