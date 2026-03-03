-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "class" "Class" NOT NULL,
    "section" "Section" NOT NULL,
    "day" TEXT NOT NULL,
    "slots" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Timetable_class_idx" ON "Timetable"("class");

-- CreateIndex
CREATE INDEX "Timetable_section_idx" ON "Timetable"("section");

-- CreateIndex
CREATE INDEX "Timetable_day_idx" ON "Timetable"("day");

-- CreateIndex
CREATE INDEX "Timetable_class_section_idx" ON "Timetable"("class", "section");

-- CreateIndex
CREATE INDEX "Timetable_createdAt_idx" ON "Timetable"("createdAt");

-- CreateIndex
CREATE INDEX "Timetable_updatedAt_idx" ON "Timetable"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_class_section_day_key" ON "Timetable"("class", "section", "day");
