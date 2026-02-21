/*
  Warnings:

  - Made the column `previousYearDetails` on table `FeeDetails` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FeeDetails" ALTER COLUMN "previousYearDetails" SET NOT NULL,
ALTER COLUMN "previousYearDetails" SET DEFAULT '[]';
