import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuración compartida de la aplicación.
 *
 * La usan tanto `main.ts` como las pruebas e2e, para que las pruebas
 * ejerciten exactamente los mismos pipes y políticas que producción.
 */
export function configureApp(app: INestApplication): INestApplication {
  // Permitir peticiones desde el frontend en desarrollo
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // whitelist: descarta propiedades no declaradas en el DTO (p. ej. role,
  // user_id) para evitar asignación masiva. transform: aplica @Transform.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}
