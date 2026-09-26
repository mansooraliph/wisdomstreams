-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "category" TEXT,
ADD COLUMN     "sections" JSONB,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

