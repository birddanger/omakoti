-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applianceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "expirationDate" TEXT NOT NULL,
    "coverageDetails" TEXT,
    "documentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Warranty_applianceId_fkey" FOREIGN KEY ("applianceId") REFERENCES "Appliance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Warranty_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AppDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "estimatedCost" TEXT,
    "category" TEXT NOT NULL,
    "nextDueDate" TEXT NOT NULL,
    "lastGeneratedDate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringTask_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Warranty_applianceId_key" ON "Warranty"("applianceId");

-- CreateIndex
CREATE UNIQUE INDEX "Warranty_documentId_key" ON "Warranty"("documentId");

-- CreateIndex
CREATE INDEX "Warranty_applianceId_idx" ON "Warranty"("applianceId");

-- CreateIndex
CREATE INDEX "Warranty_documentId_idx" ON "Warranty"("documentId");

-- CreateIndex
CREATE INDEX "RecurringTask_propertyId_idx" ON "RecurringTask"("propertyId");

-- CreateIndex
CREATE INDEX "RecurringTask_userId_idx" ON "RecurringTask"("userId");
