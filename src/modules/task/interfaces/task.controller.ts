import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
    Req
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { Task } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('api/task')
@UseGuards(AuthGuard) // Asegura que todas las rutas requieran autenticación
export class TaskController {
    constructor(private taskSvc: TaskService) { }

    @Get()
    async task(@Req() req: any): Promise<Task[]> {
        return await this.taskSvc.getAllTasks(req['user']);
    }

    @Post()
    // Prisma devuelve el objeto creado, no un array
    public async insertTask(@Body() task: CreateTaskDto, @Req() req: any): Promise<Task> {
        return this.taskSvc.insertTask(task, req['user']);
    }

    @Put('update/:id')
    // El retorno es una Task única
    public async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() task: UpdateTaskDto,
        @Req() req: any
    ): Promise<Task> {
        try {
            return await this.taskSvc.updateTask(id, task, req['user']);
        } catch (error) {
            // Prisma lanza error si no encuentra el ID al hacer update
            throw new HttpException(`Tarea con id ${id} no encontrada`, HttpStatus.NOT_FOUND);
        }
    }

    @Get(':id')
    public async findById(@Param('id', ParseIntPipe) id: number, @Req() req: any): Promise<Task> {
        const result = await this.taskSvc.getTaskById(id, req['user']);

        // Prisma devuelve null si findUnique no encuentra nada
        if (!result) {
            throw new HttpException(`Tarea con id ${id} no encontrada`, HttpStatus.NOT_FOUND);
        }
        return result;
    }

    @Delete(':id')
    public delete(@Param('id', ParseIntPipe) id: number, @Req() req: any): Promise<boolean> {
        return this.taskSvc.delete(id, req['user']);
    }
}