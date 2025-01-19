/*
  Warnings:

  - You are about to drop the column `receiverId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `conversationId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "receiverId",
ADD COLUMN     "conversationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isSupport" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supportId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_supportId_userId_key" ON "conversations"("supportId", "userId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_supportId_fkey" FOREIGN KEY ("supportId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
