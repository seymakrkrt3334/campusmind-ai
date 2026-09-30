import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { CreateDocumentInput } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('documents')
  create(@Body() body: CreateDocumentInput) {
    return this.documentsService.create(body);
  }

  @Get('documents')
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('documents/:id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get('courses/:courseId/documents')
  findByCourse(@Param('courseId') courseId: string) {
    return this.documentsService.findByCourse(courseId);
  }
}
