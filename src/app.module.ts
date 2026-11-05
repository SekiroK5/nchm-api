import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/interfaces/auth.module';
import { TaskModule } from './modules/task/interfaces/task.module';
import { UserModule } from './modules/user/interfaces/user.module';
import { PrismaService } from './common/services/prisma.service';
import { CommonModule } from './common/common';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Límite de peticiones por IP para las rutas que usan ThrottlerGuard
    // (login y refresh). Configurable con THROTTLE_LIMIT.
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        { ttl: 60_000, limit: Number(process.env.THROTTLE_LIMIT ?? 10) },
      ],
    }),
    AuthModule,
    TaskModule,
    UserModule,
    CommonModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
