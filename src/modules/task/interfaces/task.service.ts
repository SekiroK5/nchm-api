import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { Task } from '@prisma/client';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TaskService {
    constructor(private prisma: PrismaService) { }

    async getAllTasks(): Promise<Task[]> {
        return this.prisma.task.findMany();
    }

    async insertTask(data: CreateTaskDto): Promise<Task> {
        return this.prisma.task.create({
            data: {
                name: data.name,
                description: data.description,
                priority: data.priority,
                user_id: data.user_id, // Asegúrate de que el DTO tenga este campo
            },
        });
    }

    async getTaskById(id: number): Promise<Task | null> {
        return this.prisma.task.findUnique({
            where: { id },
        });
    }

    async updateTask(id: number, data: UpdateTaskDto): Promise<Task> {
        return this.prisma.task.update({
            where: { id },
            data: data,
        });
    }

    async delete(id: number): Promise<boolean> {
        try {
            await this.prisma.task.delete({ where: { id } });
            return true;
        } catch (error) {
            return false;
        }
    }
}