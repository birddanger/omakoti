-- CreateTable
CREATE TABLE "PropertyAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "inviteEmail" TEXT,
    "inviteAccepted" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyAccess_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appliance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelNumber" TEXT,
    "yearInstalled" INTEGER NOT NULL,
    "monthInstalled" INTEGER NOT NULL,
    "manualId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appliance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appliance_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "AppDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appliance" ("createdAt", "id", "manualId", "modelNumber", "monthInstalled", "propertyId", "type", "updatedAt", "yearInstalled") SELECT "createdAt", "id", "manualId", "modelNumber", "monthInstalled", "propertyId", "type", "updatedAt", "yearInstalled" FROM "Appliance";
DROP TABLE "Appliance";
ALTER TABLE "new_Appliance" RENAME TO "Appliance";
CREATE INDEX "Appliance_propertyId_idx" ON "Appliance"("propertyId");
CREATE INDEX "Appliance_manualId_idx" ON "Appliance"("manualId");
CREATE TABLE "new_SeasonalChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeasonalChecklist_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SeasonalChecklist" ("createdAt", "id", "items", "propertyId", "season", "updatedAt") SELECT "createdAt", "id", "items", "propertyId", "season", "updatedAt" FROM "SeasonalChecklist";
DROP TABLE "SeasonalChecklist";
ALTER TABLE "new_SeasonalChecklist" RENAME TO "SeasonalChecklist";
CREATE INDEX "SeasonalChecklist_propertyId_idx" ON "SeasonalChecklist"("propertyId");
CREATE UNIQUE INDEX "SeasonalChecklist_propertyId_season_key" ON "SeasonalChecklist"("propertyId", "season");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PropertyAccess_propertyId_idx" ON "PropertyAccess"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAccess_userId_idx" ON "PropertyAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAccess_propertyId_userId_key" ON "PropertyAccess"("propertyId", "userId");
