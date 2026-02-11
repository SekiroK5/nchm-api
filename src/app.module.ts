import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';
import { TaskModule } from './modules/task/task.module';
import { TaskService } from './modules/task/task.service';


@Module({
  imports: [AuthModule, TaskModule],
  providers: [AuthService, TaskService],
})
export class AppModule {}
