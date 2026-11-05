import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

@Injectable()
export class UtilService {

    constructor(private readonly jwtSvc: JwtService) { }

    public async hash(password: string) {
        return await bcrypt.hash(password, 10);
    }

    public async verifyPassword(password: string, encryptedPassword: string) {
        return await bcrypt.compare(password, encryptedPassword);
    }

    public async generateJWT(payload: any, expiresIn: any = '60s') {
        return await this.jwtSvc.signAsync(payload, {
            expiresIn: expiresIn
        })
    }

    public async getPayload(token: string) {
        return await this.jwtSvc.verifyAsync(token);
    }

    /**
     * Hash SHA-256 de un token. No se usa bcrypt porque bcrypt solo considera
     * los primeros 72 bytes de la entrada: dos JWT distintos del mismo
     * usuario comparten ese prefijo y bcrypt los consideraría iguales.
     */
    public hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    /** Compara un token con su hash en tiempo constante. */
    public matchesTokenHash(token: string, storedHash: string): boolean {
        const actual = Buffer.from(this.hashToken(token), 'hex');
        const expected = Buffer.from(storedHash, 'hex');
        return actual.length === expected.length && timingSafeEqual(actual, expected);
    }

    /** Identificador único para el claim `jti` de cada refresh token. */
    public randomId(): string {
        return randomUUID();
    }

}
