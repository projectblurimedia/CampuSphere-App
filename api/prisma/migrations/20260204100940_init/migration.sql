-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "hashedPassword" VARCHAR(255);

-- CreateIndex
CREATE INDEX "Employee_hashedPassword_idx" ON "Employee"("hashedPassword");
