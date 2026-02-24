/*
  Warnings:

  - You are about to drop the column `activated_at` on the `subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `subscriptions` DROP COLUMN `activated_at`,
    ADD COLUMN `activation_source` ENUM('PAYMENT', 'ADMIN') NOT NULL DEFAULT 'PAYMENT',
    ALTER COLUMN `provider` DROP DEFAULT;
