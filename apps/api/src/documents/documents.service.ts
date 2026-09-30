import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma-errors';

export type CreateDocumentInput = {
  title?: string;
  originalFilename?: string;
  mimeType?: string;
  status?: DocumentStatus;
  uploadedById?: string;
  courseId?: string;
};

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

  async create(input: CreateDocumentInput) {
    const title = input.title?.trim();
    if (!title) {
      throw new BadRequestException('title is required');
    }
    if (!input.uploadedById) {
      throw new BadRequestException('uploadedById is required');
    }
    if (input.status !== undefined && !isDocumentStatus(input.status)) {
      throw new BadRequestException(
        'status must be PENDING, PROCESSING, READY, or FAILED',
      );
    }

    await this.assertUserExists(input.uploadedById);
    if (input.courseId) {
      await this.assertCourseExists(input.courseId);
    }

    try {
      return await this.prisma.document.create({
        data: {
          title,
          originalFilename: input.originalFilename,
          mimeType: input.mimeType,
          status: input.status,
          uploadedById: input.uploadedById,
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
}

function isDocumentStatus(value: string): value is DocumentStatus {
  return Object.values(DocumentStatus).includes(value as DocumentStatus);
}
