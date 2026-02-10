/*
  Warnings:

  - The values [FORMATIVE_1,FORMATIVE_2,FORMATIVE_3,SUMMATIVE_1,SUMMATIVE_2,CUSTOM] on the enum `ExamType` will be removed. If these variants are still used in the database, this will fail.
  - The values [A_PLUS,B_PLUS,NA] on the enum `Grade` will be removed. If these variants are still used in the database, this will fail.
  - The values [SOCIAL_STUDIES,COMPUTER_SCIENCE,CHEMISTRY] on the enum `Subject` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customExamName` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `passingPercentage` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `Marks` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExamType_new" AS ENUM ('Formative 1', 'Formative 2', 'Formative 3', 'Summative 1', 'Summative 2', 'Pre-Final 1', 'Pre-Final 2', 'Pre-Final 3', 'Final');
ALTER TABLE "Marks" ALTER COLUMN "examType" TYPE "ExamType_new" USING ("examType"::text::"ExamType_new");
ALTER TYPE "ExamType" RENAME TO "ExamType_old";
ALTER TYPE "ExamType_new" RENAME TO "ExamType";
DROP TYPE "public"."ExamType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Grade_new" AS ENUM ('A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F', 'N/A');
ALTER TABLE "public"."Marks" ALTER COLUMN "grade" DROP DEFAULT;
ALTER TABLE "Marks" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TYPE "Grade" RENAME TO "Grade_old";
ALTER TYPE "Grade_new" RENAME TO "Grade";
DROP TYPE "public"."Grade_old";
ALTER TABLE "Marks" ALTER COLUMN "grade" SET DEFAULT 'N/A';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Subject_new" AS ENUM ('TELUGU', 'MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HINDI', 'SOCIAL', 'COMPUTERS', 'PHYSICS', 'BIOLOGY');
ALTER TABLE "Marks" ALTER COLUMN "subject" TYPE "Subject_new" USING ("subject"::text::"Subject_new");
ALTER TYPE "Subject" RENAME TO "Subject_old";
ALTER TYPE "Subject_new" RENAME TO "Subject";
DROP TYPE "public"."Subject_old";
COMMIT;

-- AlterTable
ALTER TABLE "Marks" DROP COLUMN "customExamName",
DROP COLUMN "passingPercentage",
DROP COLUMN "percentage",
ALTER COLUMN "grade" SET DEFAULT 'N/A';
