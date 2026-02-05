/*
  Warnings:

  - You are about to drop the column `isPresent` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `session` on the `Attendance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Attendance_date_session_idx";

-- DropIndex
DROP INDEX "Attendance_studentId_date_session_key";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "isPresent",
DROP COLUMN "session",
ADD COLUMN     "afternoon" BOOLEAN,
ADD COLUMN     "morning" BOOLEAN;

-- DropEnum
DROP TYPE "Session";

-- CreateIndex
CREATE INDEX "Attendance_date_morning_idx" ON "Attendance"("date", "morning");

-- CreateIndex
CREATE INDEX "Attendance_date_afternoon_idx" ON "Attendance"("date", "afternoon");

-- CreateIndex
CREATE INDEX "Attendance_morning_afternoon_idx" ON "Attendance"("morning", "afternoon");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");
