-- CreateTable
CREATE TABLE "ClassFeeStructure" (
    "id" TEXT NOT NULL,
    "className" "Class" NOT NULL,
    "totalAnnualFee" INTEGER NOT NULL,
    "tuitionFee" INTEGER NOT NULL DEFAULT 0,
    "examFee" INTEGER NOT NULL DEFAULT 0,
    "activityFee" INTEGER NOT NULL DEFAULT 0,
    "libraryFee" INTEGER NOT NULL DEFAULT 0,
    "sportsFee" INTEGER NOT NULL DEFAULT 0,
    "labFee" INTEGER NOT NULL DEFAULT 0,
    "computerFee" INTEGER NOT NULL DEFAULT 0,
    "otherCharges" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" VARCHAR(50) NOT NULL,
    "updatedBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassFeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusFeeStructure" (
    "id" TEXT NOT NULL,
    "villageName" VARCHAR(100) NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "feeAmount" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" VARCHAR(50) NOT NULL,
    "updatedBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusFeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelFeeStructure" (
    "id" TEXT NOT NULL,
    "className" "Class" NOT NULL,
    "totalAnnualFee" INTEGER NOT NULL,
    "totalTerms" INTEGER NOT NULL DEFAULT 3,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" VARCHAR(50) NOT NULL,
    "updatedBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelFeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassFeeStructure_className_idx" ON "ClassFeeStructure"("className");

-- CreateIndex
CREATE INDEX "ClassFeeStructure_isActive_idx" ON "ClassFeeStructure"("isActive");

-- CreateIndex
CREATE INDEX "BusFeeStructure_villageName_idx" ON "BusFeeStructure"("villageName");

-- CreateIndex
CREATE INDEX "BusFeeStructure_isActive_idx" ON "BusFeeStructure"("isActive");

-- CreateIndex
CREATE INDEX "HostelFeeStructure_className_idx" ON "HostelFeeStructure"("className");

-- CreateIndex
CREATE INDEX "HostelFeeStructure_isActive_idx" ON "HostelFeeStructure"("isActive");
