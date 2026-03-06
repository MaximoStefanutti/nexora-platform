import { AuthGuard } from '@nestjs/passport';

export class JwtAuhGuard extends AuthGuard('jwt') {}
