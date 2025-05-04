-- Add referral commission fields to Product
ALTER TABLE "Product" ADD COLUMN "referralCommissionType" TEXT;
ALTER TABLE "Product" ADD COLUMN "referralCommissionValue" REAL;

-- Create ShareableLink table
CREATE TABLE "ShareableLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'product',
    "title" TEXT,
    "description" TEXT,
    "customImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "totalCommission" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShareableLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShareableLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create unique index on ShareableLink.code
CREATE UNIQUE INDEX "ShareableLink_code_key" ON "ShareableLink"("code");

-- Create LinkClick table
CREATE TABLE "LinkClick" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "linkId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkClick_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareableLink" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create ReferralCommission table
CREATE TABLE "ReferralCommission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseId" INTEGER NOT NULL,
    "linkId" INTEGER NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "percentage" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferralCommission_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReferralCommission_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareableLink" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReferralCommission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReferralCommission_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReferralCommission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index on ReferralCommission.purchaseId
CREATE UNIQUE INDEX "ReferralCommission_purchaseId_key" ON "ReferralCommission"("purchaseId");

-- Add referral fields to Purchase
ALTER TABLE "Purchase" ADD COLUMN "referralLinkId" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "referralSource" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "referralData" TEXT;

-- Add foreign key constraint to Purchase
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ShareableLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
