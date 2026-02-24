/*
  Warnings:

  - You are about to drop the column `provider_payment_id` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `provider` on the `payment_transactions` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(4))`.
  - You are about to drop the column `provider_customer_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `provider_subscription_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to alter the column `provider` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(4))`.
  - A unique constraint covering the columns `[reference_code]` on the table `payment_transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference_code` to the `payment_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `payment_transactions_provider_payment_id_key` ON `payment_transactions`;

-- AlterTable
ALTER TABLE `payment_transactions` DROP COLUMN `provider_payment_id`,
    ADD COLUMN `bank_code` VARCHAR(20) NULL,
    ADD COLUMN `note` VARCHAR(255) NULL,
    ADD COLUMN `payer_name` VARCHAR(100) NULL,
    ADD COLUMN `reconcile_method` ENUM('MANUAL', 'AUTO') NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `reference_code` VARCHAR(64) NOT NULL,
    MODIFY `provider` ENUM('VIETQR') NOT NULL DEFAULT 'VIETQR';

-- AlterTable
ALTER TABLE `subscriptions` DROP COLUMN `provider_customer_id`,
    DROP COLUMN `provider_subscription_id`,
    ADD COLUMN `activated_at` DATETIME(0) NULL,
    MODIFY `provider` ENUM('VIETQR') NOT NULL DEFAULT 'VIETQR';

-- CreateIndex
CREATE UNIQUE INDEX `payment_transactions_reference_code_key` ON `payment_transactions`(`reference_code`);

-- CreateIndex
CREATE INDEX `payment_transactions_status_idx` ON `payment_transactions`(`status`);
