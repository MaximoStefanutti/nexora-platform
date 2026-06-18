/*
  Warnings:

  - You are about to drop the column `isActive` on the `Membership` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invitationTokenHash]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "isActive",
ADD COLUMN     "invitationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "invitationTokenHash" TEXT,
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Membership_invitationTokenHash_key" ON "Membership"("invitationTokenHash");
