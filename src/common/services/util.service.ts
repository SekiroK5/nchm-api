import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UtilService {

    constructor(private readonly jwtSvc: JwtService) { }

    public async hash(password: string) {
        return await bcrypt.hash(password, 10);
    }

    public async verifyPassword(password: string, encryptedPassword: string) {
        return await bcrypt.compareSync(password, encryptedPassword);
    }

    public async generateJWT(payload: any, expiresIn: any = '60s') {
        return await this.jwtSvc.signAsync(payload, {
            expiresIn: expiresIn
        })
    }

    public async getPayload(token: string) {
        return await this.jwtSvc.verifyAsync(token);
    }

}