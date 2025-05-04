-- Add metadata field to User table
ALTER TABLE "User" ADD COLUMN "metadata" TEXT;

-- CreateTable
CREATE TABLE "UserAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserAudit_userId_idx" ON "UserAudit"("userId");
CREATE INDEX "UserAudit_action_idx" ON "UserAudit"("action");
CREATE INDEX "UserAudit_createdAt_idx" ON "UserAudit"("createdAt");
