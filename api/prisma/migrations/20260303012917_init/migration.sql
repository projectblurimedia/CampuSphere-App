/*
  Warnings:

  - You are about to drop the column `slots` on the `Timetable` table. All the data in the column will be lost.
  - Changed the type of `day` on the `Timetable` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Day" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "slots",
DROP COLUMN "day",
ADD COLUMN     "day" "Day" NOT NULL;

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeName" TEXT,
    "timings" TEXT NOT NULL,
    "slotOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableSlot_timetableId_idx" ON "TimetableSlot"("timetableId");

-- CreateIndex
CREATE INDEX "TimetableSlot_employeeName_idx" ON "TimetableSlot"("employeeName");

-- CreateIndex
CREATE INDEX "TimetableSlot_type_idx" ON "TimetableSlot"("type");

-- CreateIndex
CREATE INDEX "TimetableSlot_employeeName_type_idx" ON "TimetableSlot"("employeeName", "type");

-- CreateIndex
CREATE INDEX "Timetable_day_idx" ON "Timetable"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_class_section_day_key" ON "Timetable"("class", "section", "day");

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
