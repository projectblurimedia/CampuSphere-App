/*
  Warnings:

  - You are about to drop the column `department` on the `Employee` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Employee_department_designation_idx";

-- DropIndex
DROP INDEX "Employee_department_idx";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "department";
