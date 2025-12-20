-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PropertyAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT,
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
INSERT INTO "new_PropertyAccess" ("acceptedAt", "createdAt", "id", "inviteAccepted", "inviteEmail", "invitedAt", "propertyId", "role", "updatedAt", "userId") SELECT "acceptedAt", "createdAt", "id", "inviteAccepted", "inviteEmail", "invitedAt", "propertyId", "role", "updatedAt", "userId" FROM "PropertyAccess";
DROP TABLE "PropertyAccess";
ALTER TABLE "new_PropertyAccess" RENAME TO "PropertyAccess";
CREATE INDEX "PropertyAccess_propertyId_idx" ON "PropertyAccess"("propertyId");
CREATE INDEX "PropertyAccess_userId_idx" ON "PropertyAccess"("userId");
CREATE UNIQUE INDEX "PropertyAccess_propertyId_userId_key" ON "PropertyAccess"("propertyId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
