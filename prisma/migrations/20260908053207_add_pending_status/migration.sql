-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
