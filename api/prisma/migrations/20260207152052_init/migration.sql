/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Marks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,examType]` on the table `Marks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `marksData` to the `Marks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Marks_examType_subject_idx";

-- DropIndex
DROP INDEX "Marks_grade_idx";

-- DropIndex
DROP INDEX "Marks_result_idx";

-- DropIndex
DROP INDEX "Marks_studentId_examType_subject_idx";

-- DropIndex
DROP INDEX "Marks_studentId_examType_subject_key";

-- DropIndex
DROP INDEX "Marks_studentId_subject_idx";

-- DropIndex
DROP INDEX "Marks_subject_idx";

-- AlterTable
ALTER TABLE "Marks" DROP COLUMN "createdAt",
DROP COLUMN "grade",
DROP COLUMN "marks",
DROP COLUMN "result",
DROP COLUMN "subject",
DROP COLUMN "totalMarks",
DROP COLUMN "updatedAt",
ADD COLUMN     "marksData" JSONB NOT NULL,
ADD COLUMN     "overallGrade" "Grade" NOT NULL DEFAULT 'N/A',
ADD COLUMN     "overallResult" "ResultStatus" NOT NULL DEFAULT 'NA',
ADD COLUMN     "percentage" DOUBLE PRECISION,
ADD COLUMN     "totalMaximum" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalObtained" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Marks_overallGrade_idx" ON "Marks"("overallGrade");

-- CreateIndex
CREATE INDEX "Marks_overallResult_idx" ON "Marks"("overallResult");

-- CreateIndex
CREATE INDEX "Marks_uploadedAt_idx" ON "Marks"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Marks_studentId_examType_key" ON "Marks"("studentId", "examType");
