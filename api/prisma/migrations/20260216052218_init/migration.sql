-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'CREDIT_CARD', 'OTHER');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlow" (
    "id" TEXT NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "person" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_type_name_idx" ON "Category"("type", "name");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- CreateIndex
CREATE INDEX "Item_name_idx" ON "Item"("name");

-- CreateIndex
CREATE INDEX "Item_categoryId_name_idx" ON "Item"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_categoryId_name_key" ON "Item"("categoryId", "name");

-- CreateIndex
CREATE INDEX "CashFlow_type_idx" ON "CashFlow"("type");

-- CreateIndex
CREATE INDEX "CashFlow_categoryId_idx" ON "CashFlow"("categoryId");

-- CreateIndex
CREATE INDEX "CashFlow_itemId_idx" ON "CashFlow"("itemId");

-- CreateIndex
CREATE INDEX "CashFlow_person_idx" ON "CashFlow"("person");

-- CreateIndex
CREATE INDEX "CashFlow_date_idx" ON "CashFlow"("date");

-- CreateIndex
CREATE INDEX "CashFlow_paymentMethod_idx" ON "CashFlow"("paymentMethod");

-- CreateIndex
CREATE INDEX "CashFlow_type_date_idx" ON "CashFlow"("type", "date");

-- CreateIndex
CREATE INDEX "CashFlow_categoryId_date_idx" ON "CashFlow"("categoryId", "date");

-- CreateIndex
CREATE INDEX "CashFlow_itemId_date_idx" ON "CashFlow"("itemId", "date");

-- CreateIndex
CREATE INDEX "CashFlow_person_date_idx" ON "CashFlow"("person", "date");

-- CreateIndex
CREATE INDEX "CashFlow_date_type_idx" ON "CashFlow"("date", "type");

-- CreateIndex
CREATE INDEX "CashFlow_date_type_categoryId_idx" ON "CashFlow"("date", "type", "categoryId");

-- CreateIndex
CREATE INDEX "CashFlow_date_type_itemId_idx" ON "CashFlow"("date", "type", "itemId");

-- CreateIndex
CREATE INDEX "CashFlow_type_date_amount_idx" ON "CashFlow"("type", "date", "amount");

-- CreateIndex
CREATE INDEX "CashFlow_categoryId_date_amount_idx" ON "CashFlow"("categoryId", "date", "amount");

-- CreateIndex
CREATE INDEX "FeeDetails_studentId_isFullyPaid_idx" ON "FeeDetails"("studentId", "isFullyPaid");

-- CreateIndex
CREATE INDEX "FeeDetails_discountedTotalFee_totalDue_idx" ON "FeeDetails"("discountedTotalFee", "totalDue");

-- CreateIndex
CREATE INDEX "FeeDetails_term1Due_term2Due_term3Due_idx" ON "FeeDetails"("term1Due", "term2Due", "term3Due");

-- CreateIndex
CREATE INDEX "FeeDetails_discountedSchoolFee_schoolFeePaid_idx" ON "FeeDetails"("discountedSchoolFee", "schoolFeePaid");

-- CreateIndex
CREATE INDEX "FeeDetails_discountedTransportFee_transportFeePaid_idx" ON "FeeDetails"("discountedTransportFee", "transportFeePaid");

-- CreateIndex
CREATE INDEX "FeeDetails_discountedHostelFee_hostelFeePaid_idx" ON "FeeDetails"("discountedHostelFee", "hostelFeePaid");

-- CreateIndex
CREATE INDEX "FeeDetails_term1Paid_term2Paid_term3Paid_idx" ON "FeeDetails"("term1Paid", "term2Paid", "term3Paid");

-- CreateIndex
CREATE INDEX "PaymentHistory_studentId_date_termNumber_idx" ON "PaymentHistory"("studentId", "date", "termNumber");

-- CreateIndex
CREATE INDEX "PaymentHistory_date_paymentMode_totalAmount_idx" ON "PaymentHistory"("date", "paymentMode", "totalAmount");

-- CreateIndex
CREATE INDEX "PaymentHistory_receiptNo_studentId_idx" ON "PaymentHistory"("receiptNo", "studentId");

-- CreateIndex
CREATE INDEX "Student_firstName_lastName_class_section_idx" ON "Student"("firstName", "lastName", "class", "section");

-- CreateIndex
CREATE INDEX "Student_admissionNo_class_idx" ON "Student"("admissionNo", "class");

-- CreateIndex
CREATE INDEX "Student_parentPhone_parentName_idx" ON "Student"("parentPhone", "parentName");

-- CreateIndex
CREATE INDEX "Student_village_studentType_idx" ON "Student"("village", "studentType");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
