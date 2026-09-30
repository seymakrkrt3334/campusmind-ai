import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ChatsModule } from './chats/chats.module';
import { configureApp } from './configure-app';
import { CoursesModule } from './courses/courses.module';
import { DocumentsModule } from './documents/documents.module';
import { Prisma } from './generated/prisma/client';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';

const userId = '11111111-1111-4111-8111-111111111111';
const courseId = '22222222-2222-4222-8222-222222222222';
const chatId = '33333333-3333-4333-8333-333333333333';

describe('API validation', () => {
  let app: INestApplication<App>;

  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    course: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    courseMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    chatSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        UsersModule,
        CoursesModule,
        DocumentsModule,
        ChatsModule,
      ],
      controllers: [HealthController],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
  });

  it('creates a valid user', async () => {
    prisma.user.create.mockResolvedValue({
      id: userId,
      email: 'ada@example.edu',
      name: 'Ada',
      role: 'STUDENT',
    });

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'ada@example.edu',
        name: 'Ada',
        role: 'STUDENT',
        password: 'correct-password',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.email).toBe('ada@example.edu');
        expect(response.body.passwordHash).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain('correct-password');
        const data = prisma.user.create.mock.calls[0][0].data;
        expect(data.passwordHash).not.toBe('correct-password');
        expect(String(data.passwordHash).startsWith('$2')).toBe(true);
      });
  });

  it('rejects an invalid email', () => {
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ email: 'not-an-email', password: 'correct-password' })
      .expect(400);
  });

  it('rejects an unknown request property', () => {
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'ada@example.edu',
        password: 'correct-password',
        passwordHash: 'plain',
      })
      .expect(400);
  });

  it('returns conflict for a duplicate user email', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ email: 'ada@example.edu', password: 'correct-password' })
      .expect(409)
      .expect((response) => {
        expect(response.body.message).toBe(
          'A user with this email already exists',
        );
        expect(JSON.stringify(response.body)).not.toMatch(/prisma/i);
      });
  });

  it('creates a valid course', async () => {
    prisma.course.create.mockResolvedValue({
      id: courseId,
      code: 'CS101',
      title: 'Intro',
    });

    await request(app.getHttpServer())
      .post('/api/v1/courses')
      .send({ code: 'CS101', title: 'Intro' })
      .expect(201);
  });

  it('rejects a course without a title', () => {
    return request(app.getHttpServer())
      .post('/api/v1/courses')
      .send({ code: 'CS101' })
      .expect(400);
  });

  it('rejects a malformed user id', () => {
    return request(app.getHttpServer())
      .get('/api/v1/users/not-a-uuid')
      .expect(400);
  });

  it('returns conflict for a duplicate course membership', async () => {
    prisma.course.findUnique.mockResolvedValue({ id: courseId });
    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.courseMember.findUnique.mockResolvedValue({
      userId,
      courseId,
    });

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/members`)
      .send({ userId, role: 'STUDENT' })
      .expect(409)
      .expect((response) => {
        expect(response.body.message).toBe(
          'User is already a member of this course',
        );
      });
  });

  it('rejects an invalid message role', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/chats/${chatId}/messages`)
      .send({ role: 'SYSTEM', content: 'hidden prompt' })
      .expect(400);
  });

  it('rejects empty message content', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/chats/${chatId}/messages`)
      .send({ role: 'USER', content: '   ' })
      .expect(400);
  });

  it('keeps health outside the version prefix', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ok');
        expect(response.body.database).toBe('connected');
      });
  });
});
