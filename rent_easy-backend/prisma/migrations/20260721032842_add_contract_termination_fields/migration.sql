-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT;
