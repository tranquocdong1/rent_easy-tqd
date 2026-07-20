-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CONTRACT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTRACT_UPDATED';

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "contractNumber" VARCHAR(50) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyRent" DECIMAL(12,2) NOT NULL,
    "depositAmount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");

-- CreateIndex
CREATE INDEX "Contract_roomId_idx" ON "Contract"("roomId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
