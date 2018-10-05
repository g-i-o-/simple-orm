-- diagram is at https://www.draw.io/#G1p2M18UiLJ32mwkaGqGQdo0GjbQoCWNOk
-- ask for access at giovanyvega@akcelita.com

CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `login` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`)
)  ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `tasks` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    PRIMARY KEY (`id`)
)  ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `datasets` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('images') NOT NULL,
    `taskId` INT NOT NULL,
    `uri` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `props` JSON NOT NULL,
    PRIMARY KEY (`id`)
    KEY `fk_datasets_1_idx` (`taskId` ASC),
    CONSTRAINT `fk_datasets_1` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
)  ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `roles` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `isSystemRole` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
)  ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `permissions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `uri` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    PRIMARY KEY (`id`)
)  ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `rolePermissions` (
    `roleId` INT NOT NULL,
    `permissionId` INT NOT NULL,
    PRIMARY KEY (`roleId`, `permissionId`),
    KEY `fk_rolePermissions_2_idx` (`permissionId` ASC),
    CONSTRAINT `fk_rolePermissions_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT `fk_rolePermissions_2` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
)  ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `datasetUsers` (
    `datasetId` INT NOT NULL,
    `userId` INT NOT NULL,
    `roleId` INT NOT NULL,
    PRIMARY KEY (`datasetId`,`userId`),
    KEY `fk_datasetUsers_1` (`datasetId`),
    KEY `fk_datasetUsers_2` (`userId`),
    KEY `fk_datasetUsers_3` (`roleId`),
    CONSTRAINT `fk_datasetUsers_1` FOREIGN KEY (`datasetId`) REFERENCES `datasets` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT `fk_datasetUsers_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT `fk_datasetUsers_3` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `classlists` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `datasetId` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_classList_1` (`datasetId`),
    CONSTRAINT `fk_classList_1` FOREIGN KEY (`datasetId`) REFERENCES `datasets` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `classes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `classlistId` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_classes_1` (`classlistId`),
    CONSTRAINT `fk_classes_1` FOREIGN KEY (`classlistId`) REFERENCES `classlists` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `dataobjects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `datasetId` INT NOT NULL,
    `type` ENUM('image') NOT NULL,
    `uri` VARCHAR(255) NOT NULL,
    `props` JSON NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_dataobjects_1` (`datasetId`),
    CONSTRAINT `fk_dataobjects_1` FOREIGN KEY (`datasetId`) REFERENCES `datasets` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `trainingData` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `dataobjectId` BIGINT NOT NULL,
    `type` ENUM('objectClassification') NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_trainingData_1` (`dataobjectId`),
    CONSTRAINT `fk_trainingData_1` FOREIGN KEY (`dataobjectId`) REFERENCES `dataobjects` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `trainingDataObjectClassifications` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `classId` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_trainingDataObjectClassifications_1` (`classId`),
    CONSTRAINT `fk_trainingDataObjectClassifications_1` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT `fk_trainingDataObjectClassifications_2` FOREIGN KEY (`id`) REFERENCES `trainingData` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
