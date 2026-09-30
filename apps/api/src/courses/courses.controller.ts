import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoursesService } from './courses.service';
import type {
  AddCourseMemberInput,
  CreateCourseInput,
} from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() body: CreateCourseInput) {
    return this.coursesService.create(body);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() body: AddCourseMemberInput) {
    return this.coursesService.addMember(id, body);
  }

  @Get(':id/members')
  listMembers(@Param('id') id: string) {
    return this.coursesService.listMembers(id);
  }
}
