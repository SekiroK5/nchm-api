import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./../entities/user.entity";
import { Client } from "pg";
import { PrismaService } from "src/common/services/prisma.service";
import { UpdateUserDto } from "./../dto/update-user.dto";
import { CreateUserDto } from "./../dto/create-user.dto";


@Injectable()
export class UserService {

    constructor(
        @Inject('POSTGRES_CONNECTION') private pg: Client,
        private prisma: PrismaService
    ) { }

    public async getAllUsers(): Promise<User[]> {
        const users = await this.prisma.user.findMany({
            orderBy: [{ name: "asc" }],
            select: {
                id: true,
                name: true,
                lastName: true,
                username: true,
                password: false
            }
        })
        return users;
    }

    public async getUserById(id: number): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                lastName: true,
                username: true,
                password: false
            }
        })
        return user;
    }

    public async insertUser(user: CreateUserDto): Promise<User> {
        try {
            const userCreated = await this.prisma.user.create({
                data: user,
                select: {
                    id: true,
                    name: true,
                    lastName: true,
                    username: true,
                    password: false
                }
            })
            return userCreated;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new HttpException('El nombre de usuario ya está en uso', HttpStatus.CONFLICT);
            }
            throw error;
        }
    }

    public async updateUser(id: number, userUpdate: UpdateUserDto): Promise<User> {
        const userUpdated = await this.prisma.user.update({
            where: { id },
            data: userUpdate,
            select: {
                id: true,
                name: true,
                lastName: true,
                username: true,
                password: false
            }
        })
        return userUpdated;
    }

    public async deleteUser(id: number): Promise<User | null> {

        //Primero eliminar las tareas del usuario (Considerar segun la logica del negocio, lo ideal seria 
        //que el usuario no pueda ser eliminado si tiene tareas)

        const taskCount = await this.prisma.task.count({
            where: { user_id: id }
        });

        if (taskCount > 0) {
            throw new ConflictException(
                `No se puede eliminar el usuario. Tiene ${taskCount} tareas asociadas.`
            );
        }

        //Luego eliminar el usuario 
        try {
            return await this.prisma.user.delete({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    lastName: true,
                    username: true,
                    password: false
                }
            })
            //return userDeleted;
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`El usuario con ID ${id} no existe.`);
            }
            throw error;
        }
    }
}