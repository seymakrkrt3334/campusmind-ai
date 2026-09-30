import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CourseMembershipRole } from '../../generated/prisma/client';

export class AddCourseMemberDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsEnum(CourseMembershipRole)
  role: CourseMembershipRole = CourseMembershipRole.STUDENT;
}
