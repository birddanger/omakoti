-- CreateTable
CREATE TABLE "Appliance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelNumber" TEXT,
    "yearInstalled" INTEGER NOT NULL,
    "monthInstalled" INTEGER NOT NULL,
    "manualId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appliance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE,
    CONSTRAINT "Appliance_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "AppDocument" ("id") ON DELETE SET NULL
);

-- CreateIndex
CREATE INDEX "Appliance_propertyId_idx" ON "Appliance"("propertyId");

-- CreateIndex
CREATE INDEX "Appliance_manualId_idx" ON "Appliance"("manualId");
