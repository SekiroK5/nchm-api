import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserModule } from "../../user/interfaces/user.module";
import { PrismaService } from "src/common/services/prisma.service";
import { UtilService } from "src/common/services/util.service";
import { CommonModule } from "src/common/common";

@Module({
    imports: [ConfigModule, CommonModule, UserModule],
    controllers: [AuthController],
    providers: [AuthService, PrismaService],
})
export class AuthModule { }