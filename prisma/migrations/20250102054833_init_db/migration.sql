/*
  Warnings:

  - The `sku` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "sku",
ADD COLUMN     "sku" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
