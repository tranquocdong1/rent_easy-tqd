/*
  Warnings:

  - Added the required column `issueDate` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomRent` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "electricityAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "otherAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "roomRent" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "serviceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "waterAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Invoice_contractId_billingMonth_billingYear_deletedAt_key" ON "Invoice"("contractId", "billingMonth", "billingYear") WHERE "deletedAt" IS NULL;

