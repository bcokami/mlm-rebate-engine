-- Add rewardType field to RebateConfig
ALTER TABLE "RebateConfig" ADD COLUMN "rewardType" TEXT NOT NULL DEFAULT 'percentage';

-- Add fixedAmount field to RebateConfig
ALTER TABLE "RebateConfig" ADD COLUMN "fixedAmount" DECIMAL(10, 2) DEFAULT 0;

-- Create ReferralReward table
CREATE TABLE "ReferralReward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rewardType" TEXT NOT NULL DEFAULT 'fixed',
    "amount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5, 2) DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create BonusReward table for other types of rewards
CREATE TABLE "BonusReward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rewardType" TEXT NOT NULL DEFAULT 'fixed',
    "amount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5, 2) DEFAULT 0,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Add rewardType field to Rebate
ALTER TABLE "Rebate" ADD COLUMN "rewardType" TEXT NOT NULL DEFAULT 'percentage';

-- Add walletTransactionId field to Rebate
ALTER TABLE "Rebate" ADD COLUMN "walletTransactionId" INTEGER;

-- Add FOREIGN KEY constraint
CREATE TABLE "new_Rebate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "generatorId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "percentage" DECIMAL(5, 2) NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'percentage',
    "walletTransactionId" INTEGER,
    CONSTRAINT "Rebate_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rebate_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rebate_generatorId_fkey" FOREIGN KEY ("generatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rebate_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_Rebate" ("id", "purchaseId", "receiverId", "generatorId", "level", "percentage", "amount", "status", "processedAt", "createdAt", "updatedAt", "rewardType", "walletTransactionId")
SELECT "id", "purchaseId", "receiverId", "generatorId", "level", "percentage", "amount", "status", "processedAt", "createdAt", "updatedAt", "rewardType", "walletTransactionId"
FROM "Rebate";

-- Drop old table
DROP TABLE "Rebate";

-- Rename new table to old table name
ALTER TABLE "new_Rebate" RENAME TO "Rebate";

-- Create indexes
CREATE INDEX "Rebate_purchaseId_idx" ON "Rebate"("purchaseId");
CREATE INDEX "Rebate_receiverId_idx" ON "Rebate"("receiverId");
CREATE INDEX "Rebate_generatorId_idx" ON "Rebate"("generatorId");
CREATE INDEX "Rebate_status_idx" ON "Rebate"("status");
