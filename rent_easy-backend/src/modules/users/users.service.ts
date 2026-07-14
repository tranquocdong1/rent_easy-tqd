import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as argon2 from 'argon2';
import { RefreshSessionRevokeReason, AuditAction } from '@prisma/client';
import { RefreshSessionService } from '../auth/refresh-session.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
      }
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto, reqMeta: any) {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const isValid = await argon2.verify(user.passwordHash, dto.oldPassword);
    if (!isValid) throw new BadRequestException('Mật khẩu cũ không chính xác');

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      await this.refreshSessionService.revokeAllUserSessions(tx, userId, RefreshSessionRevokeReason.PASSWORD_CHANGED);
      
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.PASSWORD_CHANGED,
          metadata: reqMeta as any,
        }
      });
    });
  }
}
