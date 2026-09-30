import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from './auth.module';
import { ChatsModule } from '../chats/chats.module';
import { configureApp } from '../configure-app';
import { hashPassword } from '../common/password';
import { CoursesModule } from '../courses/courses.module';
import { HealthController } from '../health/health.controller';
import { Prisma } from '../generated/prisma/client';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';

const studentId = '11111111-1111-4111-8111-111111111111';
const instructorId = '22222222-2222-4222-8222-222222222222';
const adminId = '33333333-3333-4333-8333-333333333333';
const otherId = '44444444-4444-4444-8444-444444444444';
const chatId = '55555555-5555-4555-8555-555555555555';

describe('Authentication', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  const users = new Map<string, Record<string, unknown>>();

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
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        CoursesModule,
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
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    prisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    prisma.user.findUnique.mockImplementation(
      async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) {
          return users.get(where.id) ?? null;
        }
        if (where.email) {
          return (
            [...users.values()].find((user) => user.email === where.email) ??
            null
          );
        }
        return null;
      },
    );
  });

  function remember(user: Record<string, unknown>) {
    users.set(String(user.id), user);
    return user;
  }

  async function tokenFor(user: { id: string; email: string; role: string }) {
    remember({
      id: user.id,
      email: user.email,
      name: 'Test',
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  it('registers a student and stores a password hash', async () => {
    prisma.user.create.mockImplementation(
      async ({ data }: { data: Record<string, string> }) => ({
        id: studentId,
        email: data.email,
        name: data.name,
        role: 'STUDENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'Ada@Example.edu',
        password: 'correct-password',
        name: 'Ada',
      })
      .expect(201);

    const stored = prisma.user.create.mock.calls[0][0].data;
    expect(stored.email).toBe('ada@example.edu');
    expect(stored.role).toBe('STUDENT');
    expect(stored.passwordHash).not.toBe('correct-password');
    expect(String(stored.passwordHash).startsWith('$2')).toBe(true);
    expect(response.body.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('correct-password');
  });

  it('rejects duplicate registration', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.edu', password: 'correct-password' })
      .expect(409);
  });

  it('rejects invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'correct-password' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.edu', password: 'short' })
      .expect(400);
  });

  it('logs in and returns an access token without a password hash', async () => {
    const passwordHash = await hashPassword('correct-password');
    remember({
      id: studentId,
      email: 'ada@example.edu',
      name: 'Ada',
      role: 'STUDENT',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.edu', password: 'correct-password' })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('ada@example.edu');
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain(passwordHash);
  });

  it('rejects a wrong password and an unknown account the same way', async () => {
    const passwordHash = await hashPassword('correct-password');
    remember({
      id: studentId,
      email: 'ada@example.edu',
      name: 'Ada',
      role: 'STUDENT',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const wrong = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.edu', password: 'wrong-password' })
      .expect(401);

    const missing = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.edu', password: 'correct-password' })
      .expect(401);

    expect(wrong.body.message).toBe('Invalid email or password');
    expect(missing.body.message).toBe(wrong.body.message);
  });

  it('requires a valid token for the current user', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401);

    const token = await tokenFor({
      id: studentId,
      email: 'ada@example.edu',
      role: 'STUDENT',
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.id).toBe(studentId);
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('rejects an expired token', async () => {
    remember({
      id: studentId,
      email: 'ada@example.edu',
      name: 'Ada',
      role: 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const token = await jwt.signAsync(
      { sub: studentId, email: 'ada@example.edu', role: 'STUDENT' },
      { expiresIn: '1ms' },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('enforces course and user roles', async () => {
    const student = await tokenFor({
      id: studentId,
      email: 'student@example.edu',
      role: 'STUDENT',
    });
    const instructor = await tokenFor({
      id: instructorId,
      email: 'instructor@example.edu',
      role: 'INSTRUCTOR',
    });
    const admin = await tokenFor({
      id: adminId,
      email: 'admin@example.edu',
      role: 'ADMIN',
    });

    await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${student}`)
      .send({ code: 'CS101', title: 'Intro' })
      .expect(403);

    prisma.course.create.mockResolvedValue({
      id: '66666666-6666-4666-8666-666666666666',
      code: 'CS101',
      title: 'Intro',
    });
    await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructor}`)
      .send({ code: 'CS101', title: 'Intro' })
      .expect(201);

    prisma.user.findMany.mockResolvedValue([
      {
        id: adminId,
        email: 'admin@example.edu',
        name: 'Admin',
        role: 'ADMIN',
      },
    ]);
    const listed = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(JSON.stringify(listed.body)).not.toContain('passwordHash');

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${student}`)
      .expect(403);
  });

  it('prevents access to another user chat', async () => {
    const owner = await tokenFor({
      id: studentId,
      email: 'owner@example.edu',
      role: 'STUDENT',
    });
    const other = await tokenFor({
      id: otherId,
      email: 'other@example.edu',
      role: 'STUDENT',
    });
    prisma.chatSession.findUnique.mockResolvedValue({
      id: chatId,
      userId: studentId,
      title: 'Private',
      user: { id: studentId, email: 'owner@example.edu', name: 'Owner' },
      course: null,
    });

    await request(app.getHttpServer())
      .get(`/api/v1/chats/${chatId}`)
      .set('Authorization', `Bearer ${other}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/v1/users/${studentId}/chats`)
      .set('Authorization', `Bearer ${other}`)
      .expect(403);

    prisma.chatSession.findMany.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get(`/api/v1/users/${studentId}/chats`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);
  });

  it('keeps health public', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });
});
