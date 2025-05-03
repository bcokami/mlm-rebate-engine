-- CreateTable
CREATE TABLE "RankRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rankId" INTEGER NOT NULL,
    "requiredPersonalSales" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "requiredGroupSales" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "requiredDirectDownline" INTEGER NOT NULL DEFAULT 0,
    "requiredQualifiedDownline" INTEGER NOT NULL DEFAULT 0,
    "qualifiedRankId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RankRequirement_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RankRequirement_qualifiedRankId_fkey" FOREIGN KEY ("qualifiedRankId") REFERENCES "Rank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RankAdvancement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "previousRankId" INTEGER NOT NULL,
    "newRankId" INTEGER NOT NULL,
    "personalSales" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "groupSales" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "directDownlineCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedDownlineCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankAdvancement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RankAdvancement_previousRankId_fkey" FOREIGN KEY ("previousRankId") REFERENCES "Rank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RankAdvancement_newRankId_fkey" FOREIGN KEY ("newRankId") REFERENCES "Rank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RankRequirement_rankId_key" ON "RankRequirement"("rankId");
