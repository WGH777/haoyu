/*
  Warnings:

  - You are about to drop the column `adminEmail` on the `AdminActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `afterState` on the `AdminActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `beforeState` on the `AdminActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `AdminActionLog` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminActionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER,
    "reason" TEXT,
    "detailJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" INTEGER NOT NULL,
    CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdminActionLog" ("action", "adminId", "createdAt", "id", "reason", "targetId", "targetType") SELECT "action", "adminId", "createdAt", "id", "reason", "targetId", "targetType" FROM "AdminActionLog";
DROP TABLE "AdminActionLog";
ALTER TABLE "new_AdminActionLog" RENAME TO "AdminActionLog";
CREATE INDEX "AdminActionLog_adminId_idx" ON "AdminActionLog"("adminId");
CREATE INDEX "AdminActionLog_targetType_targetId_idx" ON "AdminActionLog"("targetType", "targetId");
CREATE INDEX "AdminActionLog_createdAt_idx" ON "AdminActionLog"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
