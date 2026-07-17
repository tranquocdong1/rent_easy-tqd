-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'TENANT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'TENANT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TENANT_DELETED';

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "identityNumber" VARCHAR(50) NOT NULL,
    "identityIssuedDate" TIMESTAMP(3),
    "identityIssuedPlace" VARCHAR(255),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "permanentAddress" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tenant_ownerId_idx" ON "Tenant"("ownerId");

-- CreateIndex
CREATE INDEX "Tenant_ownerId_fullName_idx" ON "Tenant"("ownerId", "fullName");

-- CreateIndex
CREATE INDEX "Tenant_ownerId_phone_idx" ON "Tenant"("ownerId", "phone");

-- CreateIndex
CREATE INDEX "Tenant_ownerId_identityNumber_idx" ON "Tenant"("ownerId", "identityNumber");

-- CreateIndex
CREATE INDEX "Tenant_ownerId_createdAt_idx" ON "Tenant"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Tenant_ownerId_identityNumber_key" ON "Tenant"("ownerId", "identityNumber") WHERE "deletedAt" IS NULL;
