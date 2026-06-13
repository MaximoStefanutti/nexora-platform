import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
    /**
     * Registramos JwtModule de forma asíncrona para leer el secreto y la
     * expiración desde ConfigService (env ya validado en el arranque).
     *
     * Estos signOptions/secret aplican al ACCESS token. El REFRESH token
     * se firma en AuthService con su propio secreto (JWT_REFRESH_SECRET) y
     * su propia expiración, pasándolos explícitamente en signAsync().
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRATION') ??
            '15m') as import('ms').StringValue,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtModule], //exportamos JwtModule para usarlo en otros módulos.
})
export class AuthModule {}
