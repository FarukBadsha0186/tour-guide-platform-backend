/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `tourists` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `tourists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tourists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tourists" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tourists_email_key" ON "tourists"("email");
