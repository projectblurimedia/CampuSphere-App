-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "resetOtp" VARCHAR(6),
ADD COLUMN     "resetOtpExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Employee_resetOtp_idx" ON "Employee"("resetOtp");

-- CreateIndex
CREATE INDEX "Employee_resetOtpExpiry_idx" ON "Employee"("resetOtpExpiry");
