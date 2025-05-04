-- Create PaymentMethod table
CREATE TABLE "PaymentMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresDetails" BOOLEAN NOT NULL DEFAULT false,
    "detailsSchema" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique indexes for PaymentMethod
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");
CREATE UNIQUE INDEX "PaymentMethod_code_key" ON "PaymentMethod"("code");

-- Create UserPaymentMethod table
CREATE TABLE "UserPaymentMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index for UserPaymentMethod
CREATE UNIQUE INDEX "UserPaymentMethod_userId_paymentMethodId_key" ON "UserPaymentMethod"("userId", "paymentMethodId");

-- Add payment method fields to WalletTransaction
ALTER TABLE "WalletTransaction" ADD COLUMN "paymentMethodId" INTEGER;
ALTER TABLE "WalletTransaction" ADD COLUMN "paymentDetails" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN "referenceNumber" TEXT;

-- Add foreign key constraint to WalletTransaction
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add payment method fields to Purchase
ALTER TABLE "Purchase" ADD COLUMN "paymentMethodId" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "paymentDetails" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "referenceNumber" TEXT;

-- Add foreign key constraint to Purchase
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default payment methods
INSERT INTO "PaymentMethod" ("name", "code", "description", "isActive", "requiresDetails", "detailsSchema", "updatedAt") VALUES
('Cash', 'cash', 'Cash payment', true, false, NULL, datetime('now')),
('GCash', 'gcash', 'GCash e-wallet payment', true, true, '{"type":"object","properties":{"accountNumber":{"type":"string","description":"GCash Account Number"},"accountName":{"type":"string","description":"GCash Account Name"}},"required":["accountNumber"]}', datetime('now')),
('Maya', 'maya', 'Maya e-wallet payment', true, true, '{"type":"object","properties":{"accountNumber":{"type":"string","description":"Maya Account Number"},"accountName":{"type":"string","description":"Maya Account Name"}},"required":["accountNumber"]}', datetime('now'));
