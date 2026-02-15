-- CreateIndex
CREATE INDEX "FeeDetails_studentId_createdAt_idx" ON "FeeDetails"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "FeeDetails_discountedTotalFee_idx" ON "FeeDetails"("discountedTotalFee");

-- CreateIndex
CREATE INDEX "FeeDetails_term1DueDate_idx" ON "FeeDetails"("term1DueDate");

-- CreateIndex
CREATE INDEX "FeeDetails_term2DueDate_idx" ON "FeeDetails"("term2DueDate");

-- CreateIndex
CREATE INDEX "FeeDetails_term3DueDate_idx" ON "FeeDetails"("term3DueDate");

-- CreateIndex
CREATE INDEX "FeeDetails_studentId_totalDue_idx" ON "FeeDetails"("studentId", "totalDue");

-- CreateIndex
CREATE INDEX "FeeDetails_isFullyPaid_totalDue_idx" ON "FeeDetails"("isFullyPaid", "totalDue");

-- CreateIndex
CREATE INDEX "FeeDetails_createdAt_isFullyPaid_idx" ON "FeeDetails"("createdAt", "isFullyPaid");

-- CreateIndex
CREATE INDEX "FeeDetails_updatedAt_isFullyPaid_idx" ON "FeeDetails"("updatedAt", "isFullyPaid");

-- CreateIndex
CREATE INDEX "PaymentHistory_date_termNumber_idx" ON "PaymentHistory"("date", "termNumber");

-- CreateIndex
CREATE INDEX "PaymentHistory_date_totalAmount_idx" ON "PaymentHistory"("date", "totalAmount");

-- CreateIndex
CREATE INDEX "PaymentHistory_paymentMode_date_idx" ON "PaymentHistory"("paymentMode", "date");

-- CreateIndex
CREATE INDEX "PaymentHistory_createdAt_idx" ON "PaymentHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentHistory_date_id_idx" ON "PaymentHistory"("date", "id");
