import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../common/transforms';

export class CreateCourseDto {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  description?: string;
}
