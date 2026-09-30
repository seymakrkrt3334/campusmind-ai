import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import type { SafeUser } from '../common/safe-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('chats')
  create(@Body() body: CreateChatDto, @CurrentUser() actor: SafeUser) {
    return this.chatsService.create(actor.id, body);
  }

  @Get('chats/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.chatsService.findOne(id, actor.id);
  }

  @Get('users/:userId/chats')
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.chatsService.findByUser(userId, actor.id);
  }

  @Post('chats/:id/messages')
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateMessageDto,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.chatsService.addMessage(id, actor.id, body);
  }

  @Get('chats/:id/messages')
  listMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.chatsService.listMessages(id, actor.id);
  }
}
