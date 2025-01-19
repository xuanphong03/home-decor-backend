-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "visible" SET DEFAULT true;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "salePercent" SET DEFAULT 0,
ALTER COLUMN "popular" SET DEFAULT false,
ALTER COLUMN "visible" SET DEFAULT true,
ALTER COLUMN "rating" SET DEFAULT 0;
