-- Add binary placement fields to User table
ALTER TABLE "User" ADD COLUMN "leftLegId" INTEGER;
ALTER TABLE "User" ADD COLUMN "rightLegId" INTEGER;
ALTER TABLE "User" ADD COLUMN "placementPosition" TEXT;

-- Add foreign key constraints for binary legs
ALTER TABLE "User" ADD CONSTRAINT "User_leftLegId_fkey" FOREIGN KEY ("leftLegId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_rightLegId_fkey" FOREIGN KEY ("rightLegId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add PV field to Product table
ALTER TABLE "Product" ADD COLUMN "pv" REAL NOT NULL DEFAULT 0;

-- Add PV field to Purchase table
ALTER TABLE "Purchase" ADD COLUMN "totalPV" REAL NOT NULL DEFAULT 0;

-- Add PV-based amount to Rebate table
ALTER TABLE "Rebate" ADD COLUMN "pvAmount" REAL NOT NULL DEFAULT 0;

-- Create MonthlyPerformance table
CREATE TABLE "MonthlyPerformance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "personalPV" REAL NOT NULL DEFAULT 0,
    "leftLegPV" REAL NOT NULL DEFAULT 0,
    "rightLegPV" REAL NOT NULL DEFAULT 0,
    "totalGroupPV" REAL NOT NULL DEFAULT 0,
    "directReferralBonus" REAL NOT NULL DEFAULT 0,
    "levelCommissions" REAL NOT NULL DEFAULT 0,
    "groupVolumeBonus" REAL NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique constraint on MonthlyPerformance
CREATE UNIQUE INDEX "MonthlyPerformance_userId_year_month_key" ON "MonthlyPerformance"("userId", "year", "month");

-- Create CommissionRate table
CREATE TABLE "CommissionRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "level" INTEGER,
    "percentage" REAL NOT NULL DEFAULT 0,
    "fixedAmount" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique constraint on CommissionRate
CREATE UNIQUE INDEX "CommissionRate_type_level_key" ON "CommissionRate"("type", "level");

-- Update RankRequirement table to include PV-based requirements
ALTER TABLE "RankRequirement" ADD COLUMN "personalPV" REAL NOT NULL DEFAULT 0;
ALTER TABLE "RankRequirement" ADD COLUMN "groupPV" REAL NOT NULL DEFAULT 0;
