/*
  Warnings:

  - You are about to alter the column `markedBy` on the `Attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(70)`.

*/
-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "markedBy" SET DATA TYPE VARCHAR(70);
