ALTER TABLE `anonymousTips` ADD `senderId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `anonymousTips` ADD `senderName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `anonymousTips` ADD `senderProfileImage` text;--> statement-breakpoint
ALTER TABLE `anonymousTips` ADD `recipientId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `anonymousTips` ADD `content` longtext NOT NULL;--> statement-breakpoint
ALTER TABLE `anonymousTips` DROP COLUMN `tip`;