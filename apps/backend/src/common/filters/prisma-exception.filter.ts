import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Filtro global de excepciones de Prisma.
 * Intercepta los errores conocidos de Prisma y los convierte
 * en respuesta HTTP apropiadas con mensajes amigables.
 *
 * Registrado globalamente en main.ts con app.useGlobalFilters().
 *
 * Códigos de error de Prisma manejados:
 * - P2022: Violación de contraint único (ej; email duplicado).
 * - P2025: Registro no encontrado en operaciones de update/delete.
 * - P2003: Violación de foreign key (referencia a registro inexistente).
 *
 * Para agregar más códigos: https://www.prisma.io/docs/reference/api.reference/error-reference
 */

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Logueamos el error interno para debugging sin exponerlo al cliente.
    this.logger.error(`Prisma error ${exception.code}`, exception.message);

    switch (exception.code) {
      // Violació n de constraint único (email duplicado, slug duplicado, etc.).
      case 'P2002':
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'There is already a registry with this data',
          error: 'Conflict',
        });
        break;

      // Registro no encontrado en operaciones de update o delete.
      case 'P2025':
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        });
        break;

      // Violación de foreign key - referencia a un registro queno existe.
      case 'P2003':
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Reference to a record that does not exist',
          error: 'Bad Request',
        });
        break;

      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
    }
  }
}
