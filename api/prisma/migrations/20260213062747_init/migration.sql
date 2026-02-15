/*
  Warnings:

  - You are about to drop the column `hostelFee` on the `FeeDetails` table. All the data in the column will be lost.
  - You are about to drop the column `schoolFee` on the `FeeDetails` table. All the data in the column will be lost.
  - You are about to drop the column `totalFee` on the `FeeDetails` table. All the data in the column will be lost.
  - You are about to drop the column `transportFee` on the `FeeDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FeeDetails" DROP COLUMN "hostelFee",
DROP COLUMN "schoolFee",
DROP COLUMN "totalFee",
DROP COLUMN "transportFee",
ADD COLUMN     "discountedHostelFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountedSchoolFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountedTotalFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountedTransportFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalHostelFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalSchoolFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalTotalFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalTransportFee" INTEGER NOT NULL DEFAULT 0;
