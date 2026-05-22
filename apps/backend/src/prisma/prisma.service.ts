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

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private baseClient: PrismaClient;

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

  private buildBaseClient() {
    return this.baseClient.$extends(softDeleteExtension);
  }

  // Cliente con conetxto dee tenant + auditoria (para operaciones de negocio)
  forTenant(tenantContext: TenantContext, auditContext: AuditContext = {}) {
    return this.baseClient
      .$extends(createTenantExtension(tenantContext))
      .$extends(softDeleteExtension)
      .$extends(createAuditExtension(auditContext));
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.baseClient.$connect();
      this.logger.log(`✅ Database connected`);
    } catch (error) {
      this.logger.error(`❌ Database connection failed`, error);
    }

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

  async onModuleDestroy(): Promise<void> {
    await this.baseClient.$disconnect();
    this.logger.log('Database disconnected');
  }

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
