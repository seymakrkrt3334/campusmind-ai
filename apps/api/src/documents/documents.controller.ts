import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import type { SafeUser } from '../common/safe-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('documents')
  create(@Body() body: CreateDocumentDto, @CurrentUser() actor: SafeUser) {
    return this.documentsService.create(actor, body);
  }

  @Get('documents')
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('documents/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Get('courses/:courseId/documents')
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.documentsService.findByCourse(courseId);
  }
}
