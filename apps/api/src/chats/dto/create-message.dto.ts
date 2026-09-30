import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { MessageRole } from '../../generated/prisma/client';
import { trimString } from '../../common/transforms';

// SYSTEM messages are reserved for server-side prompts, not external clients.
export const ClientMessageRole = {
  USER: MessageRole.USER,
  ASSISTANT: MessageRole.ASSISTANT,
} as const;

export class CreateMessageDto {
  @IsEnum(ClientMessageRole)
  role!: (typeof ClientMessageRole)[keyof typeof ClientMessageRole];

  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content!: string;
}
