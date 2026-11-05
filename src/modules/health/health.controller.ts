import { Controller, Get } from '@nestjs/common';

/** Endpoint mínimo para smoke tests y pruebas de carga (k6). */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
