CREATE TABLE `truck_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`truck_number` int NOT NULL,
	`district_code` varchar(10) NOT NULL,
	`district_name_tc` varchar(30) NOT NULL,
	`district_name_en` varchar(80) NOT NULL,
	`location_name_tc` varchar(200) NOT NULL,
	`location_name_en` varchar(200),
	`address_tc` varchar(300),
	`date_from` date NOT NULL,
	`date_to` date NOT NULL,
	`closed_dates` text,
	`is_lcsd_library` boolean NOT NULL DEFAULT false,
	`notes_tc` text,
	`notes_en` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `truck_schedules_id` PRIMARY KEY(`id`)
);
