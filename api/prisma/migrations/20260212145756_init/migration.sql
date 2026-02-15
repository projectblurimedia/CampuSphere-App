/*
  Warnings:

  - You are about to drop the column `term4Due` on the `FeeDetails` table. All the data in the column will be lost.
  - You are about to drop the column `term4DueDate` on the `FeeDetails` table. All the data in the column will be lost.
  - You are about to drop the column `term4Paid` on the `FeeDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FeeDetails" DROP COLUMN "term4Due",
DROP COLUMN "term4DueDate",
DROP COLUMN "term4Paid";
