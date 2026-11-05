import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UtilService } from './util.service';

/** Sección 4 — Pruebas unitarias de hashing y tokens. */
describe('UtilService', () => {
  const util = new UtilService(new JwtService({ secret: 'unit-test-secret' }));

  it('hash() no guarda la contraseña en claro y verifyPassword() la valida', async () => {
    const hash = await util.hash('Test-Pass1');
    expect(hash).not.toContain('Test-Pass1');
    await expect(util.verifyPassword('Test-Pass1', hash)).resolves.toBe(true);
    await expect(util.verifyPassword('Wrong-Pass1', hash)).resolves.toBe(false);
  });

  it('generateJWT() y getPayload() hacen ida y vuelta', async () => {
    const token = await util.generateJWT({ id: 3 });
    await expect(util.getPayload(token)).resolves.toMatchObject({ id: 3 });
  });

  it('matchesTokenHash() distingue dos refresh tokens del mismo usuario', async () => {
    const first = await util.generateJWT({ id: 3, typ: 'refresh', jti: util.randomId() }, '7d');
    const second = await util.generateJWT({ id: 3, typ: 'refresh', jti: util.randomId() }, '7d');
    const stored = util.hashToken(second);

    expect(util.matchesTokenHash(second, stored)).toBe(true);
    expect(util.matchesTokenHash(first, stored)).toBe(false);
  });

  it('documenta por qué no se usa bcrypt para tokens largos (límite de 72 bytes)', async () => {
    const prefix = 'x'.repeat(72);
    const hash = await bcrypt.hash(prefix + 'token-A', 4);
    // bcrypt ignora todo lo que va después del byte 72:
    await expect(bcrypt.compare(prefix + 'token-B', hash)).resolves.toBe(true);
  });

  it('matchesTokenHash() tolera un hash almacenado con formato inesperado', () => {
    expect(util.matchesTokenHash('anything', 'not-hex')).toBe(false);
  });
});
