/*
  Warnings:

  - You are about to alter the column `originalPrice` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "products" ALTER COLUMN "originalPrice" SET DATA TYPE INTEGER;
