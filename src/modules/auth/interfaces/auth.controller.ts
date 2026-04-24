import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './../dto/login.dto';
import { UtilService } from 'src/common/services/util.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { access } from 'fs';

@Controller('api/auth')
export class AuthController {
    constructor(
        private authSvc: AuthService,
        private readonly utilSvc: UtilService,
    ) { }

    //POST /auth/register - 201 Created

    @Post('/login')
    @HttpCode(HttpStatus.OK)
    public async login(@Body() login: LoginDto): Promise<any> {
        const { username, password } = login;

        // Verificar el usuario y contraseña (Verificar el username para comparar con la base de datos)
        const user = await this.authSvc.getUserByUsername(username);
        if (!user) throw new UnauthorizedException('El usuario y/o contraseña es incorrecto');

        const isValid = await this.utilSvc.verifyPassword(password, user.password!);
        if (!isValid) throw new UnauthorizedException('El usuario y/o contraseña es incorrecto');

        //Obtener la informacion del usuario (Traer el id, nombre, etc)
        const { password: _pwd, username: _usr, ...payload } = user;

        // refresh token de 7 dias almacenado en BD
        const refresh_token = await this.utilSvc.generateJWT(payload, '7d');
        const hashRT = await this.utilSvc.hash(refresh_token);

        //Asignar el hash al usuario
        await this.authSvc.updateHash(user.id, hashRT);
        payload.hashToken = hashRT;

        //Generar el JWT
        const access_token = await this.utilSvc.generateJWT(payload);

        // Devolver el JWT encriptado
        return {
            access_token,
            refresh_token: hashRT,
        };
    }

    @Get('/me')
    @UseGuards(AuthGuard)
    public getProfile(@Req() request: any) {
        const user = request['user'];
        return user;
    }

    @Post('/refresh')
    @UseGuards(AuthGuard)
    public async refreshToken(@Req() request: any) {
        // Obtener el usuario ens seión
        const sessionUser = request['user'];
        const user = await this.authSvc.getUserById(sessionUser.id);
        if (!user || !user.hashToken) throw new ForbiddenException('Acceso Denegado');
        // throw new AppException('Token invalido', HttpStatus.FORBIDDEN, 'AUTH_001');

        // Comparar el token recibido con el token guardado
        if (sessionUser.hashToken !== user.hashToken) throw new ForbiddenException('Token inválido');

        const { password: _pwd, username: _usr, ...payload } = user;

        const refresh_token = await this.utilSvc.generateJWT(payload, '7d');
        const hashRT = await this.utilSvc.hash(refresh_token);
        await this.authSvc.updateHash(user.id, hashRT);
        console.log('Nuevo hash de refresh token:', hashRT);

        payload.hashToken = hashRT;
        const access_token = await this.utilSvc.generateJWT(payload);

        return { access_token, refresh_token: hashRT };
    }

    @Post('/logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard)
    public async logout(@Req() request: any) {
        const session = request['user'];
        await this.authSvc.updateHash(session.id, null);
        return;
    }
}