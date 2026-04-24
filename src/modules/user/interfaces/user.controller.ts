import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards, Req, Query, ForbiddenException } from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./../entities/user.entity";
import { CreateUserDto } from "./../dto/create-user.dto";
import { UpdateUserDto } from "./../dto/update-user.dto";
import { UtilService } from "src/common/services/util.service";
import { AuthGuard } from "src/common/guards/auth.guard";

@Controller('api/user')
export class UserController {
    constructor(private userService: UserService,
        private utilService: UtilService) { }

    @Get()
    @UseGuards(AuthGuard)
    getAllUsers(@Req() req: any): Promise<User[]> {
        if (req.user.role !== 'ADMIN') throw new ForbiddenException("No tienes permisos para ver a todos los usuarios.");
        return this.userService.getAllUsers();
    }

    @Get("logs")
    @UseGuards(AuthGuard)
    public async getLogs(@Req() req: any, @Query() query: any) {
        return this.userService.getLogs(req.user, query);
    }

    @Get(":id")
    @UseGuards(AuthGuard)
    public async listUserById(@Param("id", ParseIntPipe) id: number, @Req() req: any): Promise<User> {
        if (req.user.role !== 'ADMIN' && req.user.id !== id) throw new ForbiddenException("No tienes permisos para ver este perfil.");
        const result = await this.userService.getUserById(id);

        if (result == undefined)
            throw new HttpException(`Usuario con id ${id} no encontrado`, HttpStatus.NOT_FOUND);
        return result;
    }

    @Post()
    //@UseGuards(AuthGuard)
    public async insertUser(@Body() user: CreateUserDto): Promise<User> {
        const encryptedPassword = await this.utilService.hash(user.password);
        user.password = encryptedPassword;
        const result = await this.userService.insertUser(user);

        if (result == undefined)
            throw new HttpException("Usuario no registrado", HttpStatus.INTERNAL_SERVER_ERROR)
        return result;
    }

    @Put(":id")
    @UseGuards(AuthGuard)
    public async updateUser(@Param("id", ParseIntPipe) id: number, @Body() user: UpdateUserDto, @Req() req: any): Promise<User> {
        if (req.user.role !== 'ADMIN' && req.user.id !== id) throw new ForbiddenException("No puedes editar el perfil de otra persona.");
        return this.userService.updateUser(id, user, req.user);
    }

    @Delete(":id")
    @UseGuards(AuthGuard)
    public async deleteUser(@Param("id", ParseIntPipe) id: number, @Req() req: any): Promise<boolean> {
        if (req.user.role !== 'ADMIN' && req.user.id !== id) throw new ForbiddenException("No puedes eliminar el perfil de otra persona.");
        await this.userService.deleteUser(id, req.user);
        return true;
    }
}