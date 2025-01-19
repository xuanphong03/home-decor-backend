/*
  Warnings:

  - You are about to drop the column `slug` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "slug";
