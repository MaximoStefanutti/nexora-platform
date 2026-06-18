import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

/**
 * Servicio de gestión de usuarios.
 * Un usarui puede pertencer a múltiples tenants con distintos roles
 * a través de membresías.
 *
 * Nota: La creación de usuarios vía este servicio es para usuarios
 * creados directamente por un admin. El flujo de invitación
 * está en MembershipService.invite() que también crea usuarios.
 */

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  /**
   * Crea un nuevo usuario en el sistema.
   * Solo OWNER o ADMIN del tenant pueden crear usuarios directamente.
   * La password se hashea con bcrypt antes de persistir.
   *
   * @param data - Datos del usuario (email, password, name, phone).
   * @param tenantId - ID del tenant en cuyo contexto see crea el usuario.
   * @param requestingUserId - userId del usuario que solicita la creación.
   * @throws ForbiddenException si el solicitante no es OWNER o ADMIN.
   */

  async createUser(
    data: CreateUserDto,
    tenantId: string,
    requestingUserId: string,
  ) {
    // Validamos que el solicitante tiene permisos para crear usuarios.
    await this.membershipHelper.validateCanManageMembers(
      requestingUserId,
      tenantId,
    );

    // Hasheamos la password antes de persisitir - nunca se guarda en texto plano.
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.db.user.create({
      data: { ...data, password: hashedPassword },
      select: { id: true, email: true, name: true, phone: true },
    });
  }

  /**
   * Busca un usuario por emial retornando sus datos públicos.
   * Excluye el campo password de la respuesta.
   * Usado principalmente por el endpoint GET /user/me
   *
   * @param email - Emial del usuario a buscar.
   */

  async findEmail(email: string) {
    return this.prisma.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Lista todos los usuarios que tinen membresía en el tenant.
   * Incluye el rol y estado de la membresía  de cada usuario.
   * Útil para el panel de gestión de staff del tenant.
   *
   * @param tenantId - ID del tenant
   */

  async findByTenant(tenantId: string) {
    return this.prisma.db.user.findMany({
      where: {
        memberships: { some: { tenantId } },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        // Incluimos solo la membresía del tenant actual.
        memberships: {
          where: { tenantId },
          select: {
            id: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }
}
