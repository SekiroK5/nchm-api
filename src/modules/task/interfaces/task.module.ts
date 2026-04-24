import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { pgProvider } from 'src/common/providers/pg.provider';
import { PrismaService } from 'src/common/services/prisma.service';
import { CommonModule } from 'src/common/common';

@Module({
    imports: [CommonModule],
    controllers: [TaskController],
    providers: [TaskService, PrismaService, pgProvider],
})
export class TaskModule { }