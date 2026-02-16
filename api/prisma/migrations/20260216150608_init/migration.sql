/*
  Warnings:

  - Added the required column `updatedBy` to the `CashFlow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CashFlow" ADD COLUMN     "updatedBy" VARCHAR(50) NOT NULL;
