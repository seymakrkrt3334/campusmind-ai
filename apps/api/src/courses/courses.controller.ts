import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { AddCourseMemberDto } from './dto/add-course-member.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @Post()
  create(@Body() body: CreateCourseDto) {
    return this.coursesService.create(body);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @Post(':id/members')
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddCourseMemberDto,
  ) {
    return this.coursesService.addMember(id, body);
  }

  @Get(':id/members')
  listMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.listMembers(id);
  }
}
