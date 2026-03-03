/*
  Warnings:

  - You are about to drop the `TimetableSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TimetableSlot" DROP CONSTRAINT "TimetableSlot_timetableId_fkey";

-- DropIndex
DROP INDEX "Timetable_class_idx";

-- DropIndex
DROP INDEX "Timetable_createdAt_idx";

-- DropIndex
DROP INDEX "Timetable_section_idx";

-- DropIndex
DROP INDEX "Timetable_updatedAt_idx";

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "slots" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "TimetableSlot";
