import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { comparePassword, hashPassword } from '../common/password';
import { SafeUser, safeUserSelect } from '../common/safe-user';
import { mapPrismaError } from '../common/prisma-errors';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly invalidCredentialHash = hashPassword('invalid-credential');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<SafeUser> {
    const passwordHash = await hashPassword(input.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: UserRole.STUDENT,
        },
        select: safeUserSelect,
      });
    } catch (error) {
      mapPrismaError(error, 'A user with this email already exists');
    }
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    const passwordHash =
      user?.passwordHash ?? (await this.invalidCredentialHash);
    const passwordMatches = await comparePassword(input.password, passwordHash);
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: this.expiresIn() },
    );

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  private expiresIn(): JwtSignOptions['expiresIn'] {
    return (process.env.JWT_EXPIRES_IN ?? '1h') as JwtSignOptions['expiresIn'];
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
