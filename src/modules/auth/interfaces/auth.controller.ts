import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './../dto/login.dto';
import { UtilService } from 'src/common/services/util.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { PrismaService } from 'src/common/services/prisma.service';

const INVALID_CREDENTIALS = 'El usuario y/o contraseña es incorrecto';

@Controller('api/auth')
@UseGuards(ThrottlerGuard) // Limita intentos de login/refresh (fuerza bruta)
export class AuthController {
    constructor(
        private authSvc: AuthService,
        private readonly utilSvc: UtilService,
        private prisma: PrismaService,
    ) { }

    @Post('/login')
    @HttpCode(HttpStatus.OK)
    public async login(@Body() login: LoginDto): Promise<any> {
        const { username, password } = login;

        // Verificar el usuario y contraseña (Verificar el username para comparar con la base de datos)
        const user = await this.authSvc.getUserByUsername(username);
        if (!user) {
            await this.prisma.logs.create({
                data: {
                    statusCode: 401,
                    timestamp: new Date(),
                    path: '/api/auth/login',
                    error: `Intento de login fallido para usuario: ${username}`,
                    eventType: 'LOGIN_FAILED',
                    severity: 'WARNING'
                }
            });
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        const isValid = await this.utilSvc.verifyPassword(password, user.password!);
        if (!isValid) {
            await this.prisma.logs.create({
                data: {
                    statusCode: 401,
                    timestamp: new Date(),
                    path: '/api/auth/login',
                    error: `Contraseña incorrecta para usuario: ${username}`,
                    eventType: 'LOGIN_FAILED',
                    severity: 'WARNING',
                    session_id: user.id
                }
            });
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        return this.issueTokenPair(user);
    }

    @Get('/me')
    @UseGuards(AuthGuard)
    public getProfile(@Req() request: any) {
        const user = request['user'];
        return user;
    }

    /**
     * Rota el refresh token. El cliente envía el refresh token en
     * `Authorization: Bearer <refresh_token>` (no requiere access token
     * vigente, que es justamente el caso en que se necesita refrescar).
     *
     * - Debe ser un JWT válido, firmado y de tipo `refresh`.
     * - Debe coincidir con el hash guardado (solo el último emitido es válido).
     * - Si llega un refresh token ya rotado (reutilización), se revoca la
     *   sesión completa: el atacante y el usuario legítimo deben volver a
     *   iniciar sesión.
     */
    @Post('/refresh')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 30, ttl: 60_000 } })
    public async refreshToken(@Req() request: any) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) throw new UnauthorizedException();

        let payload: any;
        try {
            payload = await this.utilSvc.getPayload(token);
        } catch {
            throw new UnauthorizedException();
        }
        if (payload?.typ !== 'refresh') throw new UnauthorizedException();

        const user = await this.authSvc.getUserById(payload.id);
        if (!user || !user.hashToken) throw new UnauthorizedException('Sesión revocada');

        if (!this.utilSvc.matchesTokenHash(token, user.hashToken)) {
            // Reutilización de un refresh token antiguo: revocar todo.
            await this.authSvc.updateHash(user.id, null);
            await this.prisma.logs.create({
                data: {
                    statusCode: 401,
                    timestamp: new Date(),
                    path: '/api/auth/refresh',
                    error: 'Reutilización de refresh token detectada; sesión revocada',
                    eventType: 'REFRESH_REUSE',
                    severity: 'WARNING',
                    session_id: user.id,
                },
            });
            throw new UnauthorizedException('Sesión revocada');
        }

        return this.issueTokenPair(user);
    }

    @Post('/logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard)
    public async logout(@Req() request: any) {
        const session = request['user'];
        await this.authSvc.updateHash(session.id, null);
        return;
    }

    /**
     * Emite un access token (60 s) y un refresh token (7 días). En la BD solo
     * se guarda el hash SHA-256 del refresh token, nunca el token en claro.
     * El payload contiene únicamente datos públicos del usuario.
     */
    private async issueTokenPair(user: User) {
        const profile = {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        const refresh_token = await this.utilSvc.generateJWT(
            { id: user.id, typ: 'refresh', jti: this.utilSvc.randomId() },
            '7d',
        );
        await this.authSvc.updateHash(user.id, this.utilSvc.hashToken(refresh_token));

        const access_token = await this.utilSvc.generateJWT({ ...profile, typ: 'access' });

        return { access_token, refresh_token };
    }
}
