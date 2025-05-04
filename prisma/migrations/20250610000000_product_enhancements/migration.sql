-- Add new fields to Product table
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "inventory" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "binaryValue" REAL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "tags" TEXT;
ALTER TABLE "Product" ADD COLUMN "lastUpdatedBy" INTEGER;
ALTER TABLE "Product" ADD COLUMN "lastUpdatedByName" TEXT;

-- Create ProductAudit table for tracking changes
CREATE TABLE "ProductAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAudit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create index on ProductAudit.productId
CREATE INDEX "ProductAudit_productId_idx" ON "ProductAudit"("productId");

-- Create index on Product.sku
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- Create ProductSalesHistory table for tracking monthly sales
CREATE TABLE "ProductSalesHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSalesHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index on ProductSalesHistory for product, year, month
CREATE UNIQUE INDEX "ProductSalesHistory_productId_year_month_key" ON "ProductSalesHistory"("productId", "year", "month");

-- Update existing products to have a SKU (temporary values that will need to be updated)
UPDATE "Product" SET "sku" = 'PROD-' || id WHERE "sku" IS NULL;
