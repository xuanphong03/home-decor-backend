/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "name" VARCHAR(200) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_name_key" ON "conversations"("name");
