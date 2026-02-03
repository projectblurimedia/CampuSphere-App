-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('Chairperson', 'Principal', 'Vice_Principal', 'Accountant', 'Teacher', 'Other');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "address" TEXT NOT NULL,
    "village" VARCHAR(50) NOT NULL,
    "designation" "Designation" NOT NULL,
    "department" VARCHAR(50) NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualification" VARCHAR(50),
    "aadharNumber" VARCHAR(12),
    "panNumber" VARCHAR(10),
    "profilePicUrl" TEXT,
    "profilePicPublicId" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_phone_key" ON "Employee"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_aadharNumber_key" ON "Employee"("aadharNumber");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_phone_idx" ON "Employee"("phone");

-- CreateIndex
CREATE INDEX "Employee_aadharNumber_idx" ON "Employee"("aadharNumber");

-- CreateIndex
CREATE INDEX "Employee_department_idx" ON "Employee"("department");

-- CreateIndex
CREATE INDEX "Employee_designation_idx" ON "Employee"("designation");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE INDEX "Employee_joiningDate_idx" ON "Employee"("joiningDate");

-- CreateIndex
CREATE INDEX "Employee_firstName_lastName_idx" ON "Employee"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Employee_department_designation_idx" ON "Employee"("department", "designation");

-- CreateIndex
CREATE INDEX "Employee_createdAt_idx" ON "Employee"("createdAt");
