import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('api/task')
export class TaskController {
  constructor(private taskSvc: TaskService) {}

  @Get()
  public getTask(): any[] {
    return this.taskSvc.getTask();
  }

  @Get(':id')
  public getTaskById(@Param('id', ParseIntPipe) id: number ): any {
    return this.taskSvc.getTaskById(id);
  }

  @Post()
  public insertTask(@Body() task: CreateTaskDto) {
    return this.taskSvc.insert(task);
  }

  @Put('/:id')
  public updateTask(@Param('id', ParseIntPipe) id: number, @Body() task: any) {
    return this.taskSvc.update((id), task);
  }

  @Delete(':id')
  public deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.taskSvc.delete(id);
  }
}
