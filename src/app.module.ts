import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/interfaces/auth.module';
import { TaskModule } from './modules/task/interfaces/task.module';
import { UserModule } from './modules/user/interfaces/user.module';
import { PrismaService } from './common/services/prisma.service';
import { CommonModule } from './common/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, 
    TaskModule, 
    UserModule, 
    CommonModule
  ],
  providers: [PrismaService],
})
export class AppModule { }
