import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/common/services/prisma.service";
import { User } from "@prisma/client";

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    public async getUserByUsername(username: string): Promise<User | null> {
        return await this.prisma.user.findFirst({
            where: { username }
        })
    }

    public async getUserById(id: number): Promise<User | null> {
        return await this.prisma.user.findFirst({
            where: { id }
        })
    }

    public async updateHash(user_id: number, hash: string | null): Promise<User> {
        return await this.prisma.user.update({
            where: { id: user_id },
            data: { hashToken: hash }
        })

    }
}