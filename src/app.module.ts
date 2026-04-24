import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/interfaces/auth.module';
import { TaskModule } from './modules/task/interfaces/task.module';
import { UserModule } from './modules/user/interfaces/user.module';
import { PrismaService } from './common/services/prisma.service';
import { CommonModule } from './common/common';

@Module({
  imports: [AuthModule, TaskModule, UserModule, CommonModule],
  providers: [PrismaService],
})
export class AppModule { }
