import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './extensions/soft-delete.extension';
import {
  createTenantExtension,
  TenantContext,
} from './extensions/tenant.extension';
import {
  AuditContext,
  createAuditExtension,
} from './extensions/audit.extension';

/**
 * Servicio principal de Prisma para la aplicación.
 *
 * Expone dos modes de acceso a la base de datos:
 * - `db`: cliente base con soft-delete automático, para operaciones del sistema.
 * - `forTenant()`: cliente con contexto de tenant + auditoría, para operaciones de negocio.
 *
 *  Arquitectura de extensiones (orden importante):
 * tenant -> soft-delete -> audit
 * El tenant filtra primero, luego el soft-delete y finalmente la auditorio registra.
 */

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private baseClient: PrismaClient;

  /**
   * Cliente base con soft-delete aplicado automáticamente.
   * Usar para operaciones del sistema que no requieren contexto de tenant.
   * Ejemplo: validaciones en JwtStrategy, operaciones globales de admin.
   */

  // Cliente base sin contexto - para operaciones del sistema
  readonly db: ReturnType<typeof this.buildBaseClient>;

  constructor() {
    this.baseClient = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    this.db = this.buildBaseClient();
  }

  /**
   * Construye el cliente base aplicando únicamente la extensión de soft-delete.
   * Este cliente se usa para operaciones del sistema sin contexto de tenant.
   */

  private buildBaseClient() {
    return this.baseClient.$extends(softDeleteExtension);
  }

  /**
   * Construye un cliente con contexto completo de tenant y auditoría.
   * Usar en todos los services de negocio para garantizar el aisalmiento de datos.
   * @param tenantContext - Contexto del tenant actual (tenantId)
   * @param auditContext - Contexto de auditoría (userId del usuario que ejecuta la operación)
   *
   * @example
   * //* En un service de negocio:
   * this.prisma.forTenant({ tenantId }, { userId }).customer.create({ data })
   */

  // Cliente con conetxto de tenant + auditoria (para operaciones de negocio)
  forTenant(tenantContext: TenantContext, auditContext: AuditContext = {}) {
    return this.baseClient
      .$extends(createTenantExtension(tenantContext))
      .$extends(softDeleteExtension)
      .$extends(createAuditExtension(auditContext));
  }

  /**
   * Hook de NestJS - se ejecuta al inicializar el módulo.
   * Establece la conexión con la DB y configura el logging de queries en desarrollo.
   */

  async onModuleInit(): Promise<void> {
    try {
      await this.baseClient.$connect();
      this.logger.log(`✅ Database connected`);
    } catch (error) {
      this.logger.error(`❌ Database connection failed`, error);
      throw error;
    }

    //Logging de queries solo en desarrollo para no impactar performace en producción.
    if (process.env.NODE_ENV === 'development') {
      const onQuery = this.baseClient.$on.bind(this.baseClient) as (
        event: 'query',
        callback: (event: { query: string; duration: number }) => void,
      ) => void;

      onQuery('query', (event) => {
        this.logger.debug(
          `Query: ${event.query} - Duration: ${event.duration}ms`,
        );
      });
    }
  }

  /**
   * Hook de NestJS - se ejecuta al destruir el módulo.
   * Cierra la conexión con la DB de forma limpio.
   */

  async onModuleDestroy(): Promise<void> {
    await this.baseClient.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Ejecuta múltiples operaciones en una transacción atómica.
   * Si alguna operación falla, todas se revierten automáticamente.
   * @param fn - Función que recibe el clientye de transacción y ejecuta las operaciones.
   *
   * @example
   * awit this.prisma.runInTransaction(async (tx) => {
   * awit tx.tenant.create({ data: tenantData });
   * awite tx.membership.create({ data: membershipData });
   * })
   */

  async runInTransaction<T>(
    fn: (
      tx: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    return this.baseClient.$transaction(fn);
  }
}
