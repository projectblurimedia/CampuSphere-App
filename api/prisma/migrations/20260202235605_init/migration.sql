/*
  Warnings:

  - You are about to drop the column `email` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[admissionNo]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `admissionNo` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentPhone` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `section` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NOT_SPECIFIED');

-- CreateEnum
CREATE TYPE "Class" AS ENUM ('Pre-Nursery', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "StudentType" AS ENUM ('DAY_SCHOLAR', 'HOSTELLER');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('FORMATIVE_1', 'FORMATIVE_2', 'FORMATIVE_3', 'SUMMATIVE_1', 'SUMMATIVE_2', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATHEMATICS', 'SCIENCE', 'ENGLISH', 'HINDI', 'SOCIAL_STUDIES', 'COMPUTER_SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A_PLUS', 'A', 'B_PLUS', 'B', 'C', 'D', 'E', 'F', 'NA');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PASS', 'FAIL', 'NA');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE_PAYMENT', 'CARD', 'OTHER');

-- DropIndex
DROP INDEX "Student_email_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "email",
DROP COLUMN "name",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "admissionNo" VARCHAR(20) NOT NULL,
ADD COLUMN     "class" "Class" NOT NULL,
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "firstName" VARCHAR(50),
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "hostelFeeDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isUsingSchoolHostel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUsingSchoolTransport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" VARCHAR(50),
ADD COLUMN     "parentEmail" VARCHAR(50),
ADD COLUMN     "parentName" VARCHAR(50) NOT NULL,
ADD COLUMN     "parentPhone" VARCHAR(10) NOT NULL,
ADD COLUMN     "parentPhone2" VARCHAR(10),
ADD COLUMN     "profilePicPublicId" VARCHAR(500),
ADD COLUMN     "profilePicUrl" TEXT,
ADD COLUMN     "rollNo" VARCHAR(10),
ADD COLUMN     "schoolFeeDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "section" "Section" NOT NULL,
ADD COLUMN     "studentType" "StudentType" NOT NULL DEFAULT 'DAY_SCHOLAR',
ADD COLUMN     "transportFeeDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "village" VARCHAR(50);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "session" "Session" NOT NULL,
    "isPresent" BOOLEAN,
    "markedBy" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "customExamName" VARCHAR(100),
    "subject" "Subject" NOT NULL,
    "marks" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,
    "grade" "Grade" NOT NULL DEFAULT 'NA',
    "result" "ResultStatus" NOT NULL DEFAULT 'NA',
    "passingPercentage" INTEGER NOT NULL DEFAULT 35,
    "uploadedBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeDetails" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolFee" INTEGER NOT NULL DEFAULT 0,
    "transportFee" INTEGER NOT NULL DEFAULT 0,
    "hostelFee" INTEGER NOT NULL DEFAULT 0,
    "totalFee" INTEGER NOT NULL DEFAULT 0,
    "terms" INTEGER NOT NULL DEFAULT 3,
    "schoolFeePaid" INTEGER NOT NULL DEFAULT 0,
    "transportFeePaid" INTEGER NOT NULL DEFAULT 0,
    "hostelFeePaid" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "totalDue" INTEGER NOT NULL DEFAULT 0,
    "term1Due" INTEGER NOT NULL DEFAULT 0,
    "term2Due" INTEGER NOT NULL DEFAULT 0,
    "term3Due" INTEGER NOT NULL DEFAULT 0,
    "term4Due" INTEGER NOT NULL DEFAULT 0,
    "term1Paid" INTEGER NOT NULL DEFAULT 0,
    "term2Paid" INTEGER NOT NULL DEFAULT 0,
    "term3Paid" INTEGER NOT NULL DEFAULT 0,
    "term4Paid" INTEGER NOT NULL DEFAULT 0,
    "schoolFeeDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "transportFeeDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "hostelFeeDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "term1DueDate" TIMESTAMP(3),
    "term2DueDate" TIMESTAMP(3),
    "term3DueDate" TIMESTAMP(3),
    "term4DueDate" TIMESTAMP(3),
    "isFullyPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR(50) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolFeePaid" INTEGER NOT NULL DEFAULT 0,
    "transportFeePaid" INTEGER NOT NULL DEFAULT 0,
    "hostelFeePaid" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "termNumber" INTEGER,
    "receiptNo" VARCHAR(50) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "description" TEXT,
    "chequeNo" VARCHAR(50),
    "bankName" VARCHAR(100),
    "transactionId" VARCHAR(100),
    "referenceNo" VARCHAR(100),
    "receivedBy" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_date_session_idx" ON "Attendance"("date", "session");

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_session_key" ON "Attendance"("studentId", "date", "session");

-- CreateIndex
CREATE INDEX "Marks_studentId_idx" ON "Marks"("studentId");

-- CreateIndex
CREATE INDEX "Marks_examType_idx" ON "Marks"("examType");

-- CreateIndex
CREATE INDEX "Marks_subject_idx" ON "Marks"("subject");

-- CreateIndex
CREATE INDEX "Marks_grade_idx" ON "Marks"("grade");

-- CreateIndex
CREATE INDEX "Marks_result_idx" ON "Marks"("result");

-- CreateIndex
CREATE INDEX "Marks_studentId_examType_idx" ON "Marks"("studentId", "examType");

-- CreateIndex
CREATE INDEX "Marks_studentId_subject_idx" ON "Marks"("studentId", "subject");

-- CreateIndex
CREATE INDEX "Marks_examType_subject_idx" ON "Marks"("examType", "subject");

-- CreateIndex
CREATE INDEX "Marks_studentId_examType_subject_idx" ON "Marks"("studentId", "examType", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "Marks_studentId_examType_subject_key" ON "Marks"("studentId", "examType", "subject");

-- CreateIndex
CREATE INDEX "FeeDetails_studentId_idx" ON "FeeDetails"("studentId");

-- CreateIndex
CREATE INDEX "FeeDetails_isFullyPaid_idx" ON "FeeDetails"("isFullyPaid");

-- CreateIndex
CREATE INDEX "FeeDetails_totalDue_idx" ON "FeeDetails"("totalDue");

-- CreateIndex
CREATE INDEX "FeeDetails_totalDue_isFullyPaid_idx" ON "FeeDetails"("totalDue", "isFullyPaid");

-- CreateIndex
CREATE INDEX "PaymentHistory_studentId_idx" ON "PaymentHistory"("studentId");

-- CreateIndex
CREATE INDEX "PaymentHistory_receiptNo_idx" ON "PaymentHistory"("receiptNo");

-- CreateIndex
CREATE INDEX "PaymentHistory_date_idx" ON "PaymentHistory"("date");

-- CreateIndex
CREATE INDEX "PaymentHistory_paymentMode_idx" ON "PaymentHistory"("paymentMode");

-- CreateIndex
CREATE INDEX "PaymentHistory_studentId_date_idx" ON "PaymentHistory"("studentId", "date");

-- CreateIndex
CREATE INDEX "PaymentHistory_date_paymentMode_idx" ON "PaymentHistory"("date", "paymentMode");

-- CreateIndex
CREATE INDEX "PaymentHistory_receivedBy_date_idx" ON "PaymentHistory"("receivedBy", "date");

-- CreateIndex
CREATE INDEX "PaymentHistory_receiptNo_date_idx" ON "PaymentHistory"("receiptNo", "date");

-- CreateIndex
CREATE INDEX "PaymentHistory_studentId_termNumber_idx" ON "PaymentHistory"("studentId", "termNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "Student"("admissionNo");

-- CreateIndex
CREATE INDEX "Student_class_section_idx" ON "Student"("class", "section");

-- CreateIndex
CREATE INDEX "Student_admissionNo_idx" ON "Student"("admissionNo");

-- CreateIndex
CREATE INDEX "Student_rollNo_idx" ON "Student"("rollNo");

-- CreateIndex
CREATE INDEX "Student_parentPhone_idx" ON "Student"("parentPhone");

-- CreateIndex
CREATE INDEX "Student_parentEmail_idx" ON "Student"("parentEmail");

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");

-- CreateIndex
CREATE INDEX "Student_isActive_idx" ON "Student"("isActive");

-- CreateIndex
CREATE INDEX "Student_firstName_idx" ON "Student"("firstName");

-- CreateIndex
CREATE INDEX "Student_lastName_idx" ON "Student"("lastName");

-- CreateIndex
CREATE INDEX "Student_firstName_lastName_idx" ON "Student"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Student_parentName_idx" ON "Student"("parentName");

-- CreateIndex
CREATE INDEX "Student_class_section_isActive_idx" ON "Student"("class", "section", "isActive");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDetails" ADD CONSTRAINT "FeeDetails_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
