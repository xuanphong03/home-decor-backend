/*
  Warnings:

  - You are about to drop the column `cartId` on the `cart_details` table. All the data in the column will be lost.
  - You are about to drop the `carts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `cart_details` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart_details" DROP CONSTRAINT "cart_details_cartId_fkey";

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_userId_fkey";

-- AlterTable
ALTER TABLE "cart_details" DROP COLUMN "cartId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "carts";

-- AddForeignKey
ALTER TABLE "cart_details" ADD CONSTRAINT "cart_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
