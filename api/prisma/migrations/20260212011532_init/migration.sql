/*
  Warnings:

  - You are about to drop the column `libraryFee` on the `ClassFeeStructure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassFeeStructure" DROP COLUMN "libraryFee",
ADD COLUMN     "booksFee" INTEGER NOT NULL DEFAULT 0;
