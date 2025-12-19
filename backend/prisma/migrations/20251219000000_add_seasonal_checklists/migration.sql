-- CreateTable
CREATE TABLE "SeasonalChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeasonalChecklist_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "SeasonalChecklist_propertyId_idx" ON "SeasonalChecklist"("propertyId");

-- CreateUnique
CREATE UNIQUE INDEX "SeasonalChecklist_propertyId_season_key" ON "SeasonalChecklist"("propertyId", "season");
