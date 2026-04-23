import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { pgProvider } from "src/common/providers/pg.provider";
import { PrismaService } from "src/common/services/prisma.service";
import { UtilService } from "src/common/services/util.service";
import { JwtService } from '@nestjs/jwt';
import { CommonModule } from "src/common/common";

@Module({
    imports: [CommonModule],
    controllers: [UserController],
    providers: [UserService, PrismaService, pgProvider],
    exports: [UserService],
})
export class UserModule { }