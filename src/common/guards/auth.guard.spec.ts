import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UtilService } from '../services/util.service';
import { AuthGuard } from './auth.guard';

/** Sección 4 — Prueba unitaria del guard JWT con tokens firmados en memoria. */
describe('AuthGuard', () => {
  const jwt = new JwtService({ secret: 'unit-test-secret' });
  const guard = new AuthGuard(new UtilService(jwt));

  const contextWith = (authorization?: string) => {
    const req: any = { headers: authorization ? { authorization } : {} };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    return { req, ctx };
  };

  it('rechaza una petición sin encabezado Authorization', async () => {
    await expect(guard.canActivate(contextWith().ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un esquema distinto de Bearer', async () => {
    const token = jwt.sign({ id: 1 });
    await expect(
      guard.canActivate(contextWith(`Basic ${token}`).ctx),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const forged = new JwtService({ secret: 'other' }).sign({ id: 1 });
    await expect(
      guard.canActivate(contextWith(`Bearer ${forged}`).ctx),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un token expirado', async () => {
    const expired = jwt.sign({ id: 1, exp: Math.floor(Date.now() / 1000) - 5 });
    await expect(
      guard.canActivate(contextWith(`Bearer ${expired}`).ctx),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un refresh token usado como access token', async () => {
    const refresh = jwt.sign({ id: 1, typ: 'refresh' });
    await expect(
      guard.canActivate(contextWith(`Bearer ${refresh}`).ctx),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('acepta un access token válido y adjunta el usuario a la petición', async () => {
    const token = jwt.sign({ id: 7, role: 'USER', typ: 'access' });
    const { req, ctx } = contextWith(`Bearer ${token}`);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toMatchObject({ id: 7, role: 'USER' });
  });
});
