-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "isSuper" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isRoot" BOOLEAN NOT NULL DEFAULT false;
