-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "certification_name" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "roll_number" TEXT;
