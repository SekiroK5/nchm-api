//Globales: guards, interceptors, filters, decoratorsimport { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UtilService } from './services/util.service';

@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_ACCESS_SECRET'),
                signOptions: { expiresIn: '60s' },
            }),
        }),
    ],
    providers: [UtilService],
    exports: [UtilService, JwtModule],
})
export class CommonModule { }