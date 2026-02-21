/*
  Warnings:

  - The values [11,12] on the enum `Class` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Class_new" AS ENUM ('Pre-Nursery', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10');
ALTER TABLE "Student" ALTER COLUMN "class" TYPE "Class_new" USING ("class"::text::"Class_new");
ALTER TABLE "ClassFeeStructure" ALTER COLUMN "className" TYPE "Class_new" USING ("className"::text::"Class_new");
ALTER TABLE "HostelFeeStructure" ALTER COLUMN "className" TYPE "Class_new" USING ("className"::text::"Class_new");
ALTER TYPE "Class" RENAME TO "Class_old";
ALTER TYPE "Class_new" RENAME TO "Class";
DROP TYPE "public"."Class_old";
COMMIT;

-- AlterTable
ALTER TABLE "FeeDetails" ADD COLUMN     "previousYearDetails" JSONB DEFAULT '{}',
ADD COLUMN     "previousYearFee" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "studiedClasses" JSONB NOT NULL DEFAULT '[]';
