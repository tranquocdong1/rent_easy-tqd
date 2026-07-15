import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  const testUser = {
    email: 'test-users-e2e@example.com',
    password: 'password123',
    newPassword: 'newpassword123',
    fullName: 'Test User Profile',
  };

  let accessToken: string;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Clean up if exists
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    
    // Create test user
    const passwordHash = await argon2.hash(testUser.password);
    await prisma.user.create({
      data: {
        email: testUser.email,
        passwordHash,
        fullName: testUser.fullName,
      },
    });

    // Login to get token
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    
    accessToken = res.body.data.accessToken;
    const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
    refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken=')) || '';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('Feature 4: Profile', () => {
    it('/v1/users/me (GET) - Success', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
      expect(res.body.fullName).toBe(testUser.fullName);
    });

    it('/v1/users/me (PATCH) - Update FullName', async () => {
      const newName = 'Updated Test User';
      const res = await request(app.getHttpServer())
        .patch('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fullName: newName })
        .expect(200);

      expect(res.body.fullName).toBe(newName);
    });
  });

  describe('Feature 5: Change Password', () => {
    it('/v1/users/change-password (PATCH) - Success', async () => {
      const res = await request(app.getHttpServer())
        .patch('/v1/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: testUser.password, newPassword: testUser.newPassword })
        .expect(200);

      expect(res.body.message).toContain('Password changed successfully');
    });

    it('Old Refresh Token should be revoked after password change', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(401);
    });

    it('Should be able to login with the new password', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: testUser.email, password: testUser.newPassword })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
    });
  });
});
