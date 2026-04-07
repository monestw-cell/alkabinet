CREATE TABLE `anonymousTips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tip` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anonymousTips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charityArchive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('dua','quran_verse') NOT NULL,
	`content` longtext NOT NULL,
	`arabicContent` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `charityArchive_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `confessionMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`originalMessage` longtext NOT NULL,
	`arabicMessage` longtext NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `confessionMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditorId` int NOT NULL,
	`debtorId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text,
	`isPaid` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `embarrassingMoments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `embarrassingMoments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedById` int NOT NULL,
	`photoUrl` text NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviterId` int NOT NULL,
	`inviteeId` int NOT NULL,
	`invitationType` varchar(255) NOT NULL,
	`status` enum('pending','accepted','declined') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedUserId` int,
	`relatedItemId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pesResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`winnerId` int,
	`loserId` int,
	`didNotPlayIds` text,
	`date` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pesResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photoVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`voterId` int NOT NULL,
	`photoId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photoVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raterId` int NOT NULL,
	`ratedUserId` int NOT NULL,
	`rating` tinyint NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`week` int NOT NULL,
	`year` int NOT NULL,
	`votes` int DEFAULT 0,
	`isWinner` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weeklyPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `fullName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` text;--> statement-breakpoint
ALTER TABLE `users` ADD `specialization` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `hobbies` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isProfileComplete` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);