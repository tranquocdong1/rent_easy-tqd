import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  const testUser = {
    email: 'test-auth-e2e@example.com',
    password: 'password123',
    fullName: 'Test User Auth',
  };

  let refreshTokenCookie: string;
  let oldRefreshTokenCookie: string; // Used for reuse test

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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('Feature 1: Authentication Login', () => {
    it('/v1/auth/login (POST) - Success', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testUser.email);
      
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      expect(cookies).toBeDefined();
      
      // Extract refreshToken for next tests
      const cookieHeader = cookies.find(c => c.startsWith('refreshToken=')) || '';
      refreshTokenCookie = cookieHeader.split(';')[0];
      expect(refreshTokenCookie).toContain('refreshToken=');
    });

    it('/v1/auth/login (POST) - Failed (Wrong Password)', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('Feature 2: Refresh Token', () => {
    it('/v1/auth/refresh (POST) - Success', async () => {
      oldRefreshTokenCookie = refreshTokenCookie; // Save old token for reuse test
      
      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      const cookieHeader = cookies.find(c => c.startsWith('refreshToken=')) || '';
      refreshTokenCookie = cookieHeader.split(';')[0];
      expect(refreshTokenCookie).toContain('refreshToken=');
      expect(refreshTokenCookie).not.toEqual(oldRefreshTokenCookie); // Must be rotated
    });

    it('/v1/auth/refresh (POST) - Reuse Token (Detect & Block)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [oldRefreshTokenCookie]) // Reusing the old token
        .expect(401);

      expect(res.body.message).toContain('sử dụng lại token');
    });

    it('/v1/auth/refresh (POST) - Blocked after Reuse', async () => {
      // Even the newly issued valid token should be blocked now because all sessions are revoked
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(401);
    });
  });

  describe('Feature 3: Logout', () => {
    let freshTokenCookie: string;
    
    beforeAll(async () => {
      // Login again to get a fresh token for logout test
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
        
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      const cookieHeader = cookies.find(c => c.startsWith('refreshToken=')) || '';
      freshTokenCookie = cookieHeader.split(';')[0];
    });

    it('/v1/auth/logout (POST) - Success', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Cookie', [freshTokenCookie])
        .expect(200);
        
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      const clearCookie = cookies.find(c => c.startsWith('refreshToken=;'));
      expect(clearCookie).toBeDefined(); // Cookie should be cleared
    });

    it('Cannot refresh after logout', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [freshTokenCookie])
        .expect(401); // Session revoked
    });
  });
});
