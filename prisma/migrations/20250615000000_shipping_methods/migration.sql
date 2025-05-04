-- Create ShippingMethod table
CREATE TABLE "ShippingMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresDetails" BOOLEAN NOT NULL DEFAULT false,
    "detailsSchema" TEXT,
    "baseFee" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique indexes for ShippingMethod
CREATE UNIQUE INDEX "ShippingMethod_name_key" ON "ShippingMethod"("name");
CREATE UNIQUE INDEX "ShippingMethod_code_key" ON "ShippingMethod"("code");

-- Add shipping method fields to Purchase
ALTER TABLE "Purchase" ADD COLUMN "shippingMethodId" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "shippingDetails" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "shippingAddress" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "shippingFee" REAL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "shippingStatus" TEXT DEFAULT 'pending';

-- Add foreign key constraint to Purchase
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default shipping methods
INSERT INTO "ShippingMethod" ("name", "code", "description", "isActive", "requiresDetails", "detailsSchema", "baseFee", "updatedAt") VALUES
('Pickup from Store', 'pickup', 'Pickup from our physical store', true, true, '{"type":"object","properties":{"preferredDate":{"type":"string","description":"Preferred Pickup Date","format":"date"},"notes":{"type":"string","description":"Additional Notes"}},"required":["preferredDate"]}', 0, datetime('now')),
('Lalamove', 'lalamove', 'Same-day delivery via Lalamove', true, true, '{"type":"object","properties":{"contactPerson":{"type":"string","description":"Contact Person"},"contactNumber":{"type":"string","description":"Contact Number"},"landmark":{"type":"string","description":"Landmark (Optional)"}},"required":["contactPerson","contactNumber"]}', 150, datetime('now')),
('J&T Express', 'jnt', 'Nationwide delivery via J&T Express', true, true, '{"type":"object","properties":{"contactPerson":{"type":"string","description":"Contact Person"},"contactNumber":{"type":"string","description":"Contact Number"},"landmark":{"type":"string","description":"Landmark (Optional)"}},"required":["contactPerson","contactNumber"]}', 100, datetime('now'));
