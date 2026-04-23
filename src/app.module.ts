import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';
import { TaskModule } from './modules/task/task.module';
import { TaskService } from './modules/task/task.service';
import { PrismaService } from './prisma.service';


@Module({
  imports: [AuthModule, TaskModule, PrismaService],
  providers: [AuthService, TaskService, PrismaService],
})
export class AppModule {}
