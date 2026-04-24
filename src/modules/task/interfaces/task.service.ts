import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { Task } from '@prisma/client';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TaskService {
    constructor(private prisma: PrismaService) { }

    async getAllTasks(user: any): Promise<Task[]> {
        return this.prisma.task.findMany();
    }

    async insertTask(data: CreateTaskDto, user: any): Promise<Task> {
        const task = await this.prisma.task.create({
            data: {
                name: data.name,
                description: data.description,
                priority: data.priority,
                user_id: user.id, // Enforce current user
            },
        });

        await this.prisma.logs.create({
            data: {
                statusCode: 201,
                timestamp: new Date(),
                path: 'TaskService.insertTask',
                eventType: 'TASK_CREATED',
                severity: 'INFO',
                session_id: user.id,
                error: `Tarea creada: ${task.id}`
            }
        });

        return task;
    }

    async getTaskById(id: number, user: any): Promise<Task | null> {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task) return null;
        return task;
    }

    async updateTask(id: number, data: UpdateTaskDto, user: any): Promise<Task> {
        const task = await this.getTaskById(id, user);
        if (!task) throw new NotFoundException('Tarea no encontrada');

        if (user.role !== 'ADMIN' && task.user_id !== user.id) {
            throw new ForbiddenException('No tienes permiso para actualizar esta tarea');
        }

        return this.prisma.task.update({
            where: { id },
            data: data,
        });
    }

    async delete(id: number, user: any): Promise<boolean> {
        const task = await this.getTaskById(id, user);
        if (!task) throw new NotFoundException('Tarea no encontrada');

        if (user.role !== 'ADMIN' && task.user_id !== user.id) {
            throw new ForbiddenException('No tienes permiso para eliminar esta tarea');
        }

        try {
            await this.prisma.task.delete({ where: { id } });
            await this.prisma.logs.create({
                data: {
                    statusCode: 200,
                    timestamp: new Date(),
                    path: 'TaskService.delete',
                    eventType: 'TASK_DELETED',
                    severity: 'INFO',
                    session_id: user.id,
                    error: `Tarea eliminada: ${id}`
                }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}