import * as Joi from 'joi';

/**
 * Esquema de validación de variables de entorno.
 *
 * Se aplica en ConfigModule.forRoot() con `abortEarly: false` para que,
 * si falta o es inválida cualquier variable crítica, la aplicación
 * NO arranque y muestre todos los errores de una sola vez (fail-fast).
 *
 * Esto evita el peor escenario de seguridad: arrancar en producción
 * con un secreto de JWT vacío o con un fallback predecible.
 */
export const envValidationSchema = Joi.object({
  // Entorno de ejecución
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Puerto del servidor HTTP
  PORT: Joi.number().port().default('PORT'),

  // Conexión a la base de datos (Prisma)
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  // Secretos JWT — obligatorios y con longitud mínima para evitar secretos débiles.
  // Sin valor por defecto a propósito: si falta, la app debe fallar al arrancar.
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  // Expiraciones de tokens (formato de `ms`/jsonwebtoken: '15m', '7d', etc.)
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // URL(s) del frontend permitidas por CORS. Acepta una o varias separadas por coma.
  FRONTEND_URL: Joi.string().default('FONTEND_URL'),
})
  // No permitimos que el access y el refresh secret sean iguales:
  // si uno se filtra, no debe comprometer al otro.
  .custom((value: Record<string, string>, helpers) => {
    if (
      value.JWT_ACCESS_SECRET &&
      value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET
    ) {
      return helpers.error('any.invalid', {
        message: 'JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos',
      });
    }
    return value;
  }, 'JWT secrets distintos');
