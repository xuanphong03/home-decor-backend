/*
  Warnings:

  - Added the required column `districtName` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provinceName` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "districtName" TEXT NOT NULL,
ADD COLUMN     "provinceName" TEXT NOT NULL;
