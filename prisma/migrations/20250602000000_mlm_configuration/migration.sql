-- Create SystemConfig table
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique index on SystemConfig.key
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- Create PerformanceBonusTier table
CREATE TABLE "PerformanceBonusTier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "minSales" REAL NOT NULL,
    "maxSales" REAL,
    "bonusType" TEXT NOT NULL,
    "percentage" REAL NOT NULL DEFAULT 0,
    "fixedAmount" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create MonthlyCutoff table
CREATE TABLE "MonthlyCutoff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "cutoffDay" INTEGER NOT NULL,
    "processedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique index on MonthlyCutoff
CREATE UNIQUE INDEX "MonthlyCutoff_year_month_key" ON "MonthlyCutoff"("year", "month");

-- Insert default system configuration
INSERT INTO "SystemConfig" ("key", "value", "description", "updatedAt") VALUES
('mlm_structure', 'binary', 'MLM structure type: binary or unilevel', datetime('now')),
('pv_calculation', 'percentage', 'PV calculation method: percentage or fixed', datetime('now')),
('performance_bonus_enabled', 'false', 'Whether performance bonus is enabled', datetime('now')),
('monthly_cutoff_day', '25', 'Day of month for commission cutoff', datetime('now')),
('binary_max_depth', '6', 'Maximum depth for binary structure', datetime('now')),
('unilevel_max_depth', '6', 'Maximum depth for unilevel structure', datetime('now'));

-- Insert default performance bonus tiers
INSERT INTO "PerformanceBonusTier" ("name", "minSales", "maxSales", "bonusType", "percentage", "fixedAmount", "active", "updatedAt") VALUES
('Bronze', 1000, 2999, 'percentage', 2, 0, true, datetime('now')),
('Silver', 3000, 5999, 'percentage', 3, 0, true, datetime('now')),
('Gold', 6000, 9999, 'percentage', 5, 0, true, datetime('now')),
('Platinum', 10000, NULL, 'percentage', 7, 0, true, datetime('now'));

-- Add performance_bonus type to CommissionRate
INSERT INTO "CommissionRate" ("type", "percentage", "fixedAmount", "description", "active", "updatedAt") VALUES
('performance_bonus', 5, 0, 'Performance bonus based on personal sales', true, datetime('now'));
