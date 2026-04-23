import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
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
    getAllUsers(): Promise<User[]> {
        return this.userService.getAllUsers();
    }

    @Get(":id")
    @UseGuards(AuthGuard)
    public async listUserById(@Param("id", ParseIntPipe) id: number): Promise<User> {
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
    public async updateUser(@Param("id", ParseIntPipe) id: number, @Body() user: UpdateUserDto): Promise<User> {
        return this.userService.updateUser(id, user);
    }

    @Delete(":id")
    @UseGuards(AuthGuard)
    public async deleteUser(@Param("id", ParseIntPipe) id: number): Promise<boolean> {
        await this.userService.deleteUser(id);
        return true;
    }
}