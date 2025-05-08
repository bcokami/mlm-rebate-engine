-- Add indexes to improve query performance

-- User indexes
CREATE INDEX IF NOT EXISTS "User_uplineId_idx" ON "User"("uplineId");
CREATE INDEX IF NOT EXISTS "User_sponsorId_idx" ON "User"("sponsorId");
CREATE INDEX IF NOT EXISTS "User_rankId_idx" ON "User"("rankId");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_testData_idx" ON "User"("testData");

-- Purchase indexes
CREATE INDEX IF NOT EXISTS "Purchase_userId_idx" ON "Purchase"("userId");
CREATE INDEX IF NOT EXISTS "Purchase_productId_idx" ON "Purchase"("productId");
CREATE INDEX IF NOT EXISTS "Purchase_createdAt_idx" ON "Purchase"("createdAt");
CREATE INDEX IF NOT EXISTS "Purchase_status_idx" ON "Purchase"("status");
CREATE INDEX IF NOT EXISTS "Purchase_orderId_idx" ON "Purchase"("orderId");
CREATE INDEX IF NOT EXISTS "Purchase_testData_idx" ON "Purchase"("testData");

-- Rebate indexes
CREATE INDEX IF NOT EXISTS "Rebate_purchaseId_idx" ON "Rebate"("purchaseId");
CREATE INDEX IF NOT EXISTS "Rebate_receiverId_idx" ON "Rebate"("receiverId");
CREATE INDEX IF NOT EXISTS "Rebate_generatorId_idx" ON "Rebate"("generatorId");
CREATE INDEX IF NOT EXISTS "Rebate_status_idx" ON "Rebate"("status");
CREATE INDEX IF NOT EXISTS "Rebate_createdAt_idx" ON "Rebate"("createdAt");
CREATE INDEX IF NOT EXISTS "Rebate_testData_idx" ON "Rebate"("testData");

-- WalletTransaction indexes
CREATE INDEX IF NOT EXISTS "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_type_idx" ON "WalletTransaction"("type");
CREATE INDEX IF NOT EXISTS "WalletTransaction_status_idx" ON "WalletTransaction"("status");
CREATE INDEX IF NOT EXISTS "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- Order indexes
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_shippingAddressId_idx" ON "Order"("shippingAddressId");
CREATE INDEX IF NOT EXISTS "Order_shippingMethodId_idx" ON "Order"("shippingMethodId");

-- ShareableLink indexes
CREATE INDEX IF NOT EXISTS "ShareableLink_userId_idx" ON "ShareableLink"("userId");
CREATE INDEX IF NOT EXISTS "ShareableLink_productId_idx" ON "ShareableLink"("productId");
CREATE INDEX IF NOT EXISTS "ShareableLink_isActive_idx" ON "ShareableLink"("isActive");
CREATE INDEX IF NOT EXISTS "ShareableLink_createdAt_idx" ON "ShareableLink"("createdAt");
CREATE INDEX IF NOT EXISTS "ShareableLink_testData_idx" ON "ShareableLink"("testData");

-- LinkClick indexes
CREATE INDEX IF NOT EXISTS "LinkClick_linkId_idx" ON "LinkClick"("linkId");
CREATE INDEX IF NOT EXISTS "LinkClick_createdAt_idx" ON "LinkClick"("createdAt");
CREATE INDEX IF NOT EXISTS "LinkClick_testData_idx" ON "LinkClick"("testData");

-- InventoryTransaction indexes
CREATE INDEX IF NOT EXISTS "InventoryTransaction_productId_idx" ON "InventoryTransaction"("productId");
CREATE INDEX IF NOT EXISTS "InventoryTransaction_type_idx" ON "InventoryTransaction"("type");
CREATE INDEX IF NOT EXISTS "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_productId_idx" ON "Notification"("productId");
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "Rebate_receiverId_status_idx" ON "Rebate"("receiverId", "status");
CREATE INDEX IF NOT EXISTS "Rebate_receiverId_createdAt_idx" ON "Rebate"("receiverId", "createdAt");
CREATE INDEX IF NOT EXISTS "Purchase_userId_createdAt_idx" ON "Purchase"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "User_uplineId_rankId_idx" ON "User"("uplineId", "rankId");
CREATE INDEX IF NOT EXISTS "Order_userId_status_idx" ON "Order"("userId", "status");
CREATE INDEX IF NOT EXISTS "ShareableLink_userId_isActive_idx" ON "ShareableLink"("userId", "isActive");
