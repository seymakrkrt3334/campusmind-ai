import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatsService } from './chats.service';
import type { CreateChatInput, CreateMessageInput } from './chats.service';

@Controller()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('chats')
  create(@Body() body: CreateChatInput) {
    return this.chatsService.create(body);
  }

  @Get('chats/:id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  @Get('users/:userId/chats')
  findByUser(@Param('userId') userId: string) {
    return this.chatsService.findByUser(userId);
  }

  @Post('chats/:id/messages')
  addMessage(@Param('id') id: string, @Body() body: CreateMessageInput) {
    return this.chatsService.addMessage(id, body);
  }

  @Get('chats/:id/messages')
  listMessages(@Param('id') id: string) {
    return this.chatsService.listMessages(id);
  }
}
