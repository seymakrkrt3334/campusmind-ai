import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function mapPrismaError(
  error: unknown,
  conflictMessage = 'Resource already exists',
): never {
  if (isUniqueConstraintError(error)) {
    throw new ConflictException(conflictMessage);
  }

  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    throw new BadRequestException('Invalid request data');
  }

  throw error;
}
