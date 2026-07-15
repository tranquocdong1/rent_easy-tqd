import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshSessionService } from './refresh-session.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.register({}),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshSessionService, JwtStrategy],
  exports: [AuthService, RefreshSessionService, JwtModule, PassportModule],
})
export class AuthModule {}
