-- MySQL dump 10.13  Distrib 8.0.34, for Linux (x86_64)
--
-- Host: localhost    Database: atomid
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `atomid`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `atomid` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `atomid`;

--
-- Table structure for table `auth_events`
--

DROP TABLE IF EXISTS `auth_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` tinyint(1) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `address` varchar(255) DEFAULT NULL,
  `service` varchar(255) DEFAULT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `auth_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_events`
--

LOCK TABLES `auth_events` WRITE;
/*!40000 ALTER TABLE `auth_events` DISABLE KEYS */;
INSERT INTO `auth_events` VALUES (1,1,1,1,'10.16.204.8','ATOMID',NULL,'2023-09-16 14:19:27'),(2,1,1,1,'10.16.204.8','ATOMID',NULL,'2023-09-17 04:47:01'),(3,1,1,1,'10.16.204.8','ATOMID',NULL,'2023-09-17 04:53:22'),(5,1,1,2,'10.20.0.1','ATOMID','Internal server error','2026-04-16 07:00:23'),(6,1,1,1,'10.20.0.1','ATOMID',NULL,'2026-04-16 07:01:01'),(7,1,1,1,'10.20.0.1','ATOMID',NULL,'2026-04-16 07:02:01');
/*!40000 ALTER TABLE `auth_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_histories`
--

DROP TABLE IF EXISTS `auth_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `request_url` varchar(255) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_histories`
--

LOCK TABLES `auth_histories` WRITE;
/*!40000 ALTER TABLE `auth_histories` DISABLE KEYS */;
INSERT INTO `auth_histories` VALUES (31,1,'/login','::ffff:10.20.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 07:02:01','2026-04-16 07:02:01');
/*!40000 ALTER TABLE `auth_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `country_code` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `billing_address` varchar(255) DEFAULT NULL,
  `tax_code` varchar(255) DEFAULT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `type` int NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain` (`domain`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'FPT Software Ltd','VN','FPT Software Ltd','84','0123456789','Hoa Lac High Tech Park','Hoa Lac High Tech Park','100000','fsoft.com.vn',1,'fso','2020-05-12 09:39:00','2020-05-12 09:39:00');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_users`
--

DROP TABLE IF EXISTS `company_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `status` int NOT NULL,
  `role` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `company_users_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_users`
--

LOCK TABLES `company_users` WRITE;
/*!40000 ALTER TABLE `company_users` DISABLE KEYS */;
INSERT INTO `company_users` VALUES (1,1,1,2,2,'2023-06-12 06:49:46','2023-06-12 06:49:46');
/*!40000 ALTER TABLE `company_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_users`
--

DROP TABLE IF EXISTS `group_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  `status` int NOT NULL,
  `role` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `group_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_users_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_users`
--

LOCK TABLES `group_users` WRITE;
/*!40000 ALTER TABLE `group_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `company_id` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,'ATOM-Leader','ATOMLD',1,'2023-06-12 06:49:46','2023-06-12 06:49:46'),(4,'ATOMID','ATOMID',1,'2023-06-12 06:49:46','2023-06-12 06:49:46'),(5,'Tester40','Tester40',1,'2023-06-12 06:49:46','2023-06-12 06:49:46'),(6,'Test Man','TM',1,'2023-06-12 06:49:46','2023-06-12 06:49:46');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitations`
--

DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `requester_id` int NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `hash_token` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `requester_id` (`requester_id`),
  CONSTRAINT `invitations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invitations_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitations`
--

LOCK TABLES `invitations` WRITE;
/*!40000 ALTER TABLE `invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES ('v000-not-require-nationality.js'),('v001-add-mfa-column.js'),('v002-add-password-expired-at.js'),('v003-add-expired-at-users.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_services`
--

DROP TABLE IF EXISTS `status_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_services` (
  `id` varchar(255) NOT NULL,
  `customer` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `port` int DEFAULT NULL,
  `group_name` varchar(255) DEFAULT NULL,
  `service` varchar(255) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_services`
--

LOCK TABLES `status_services` WRITE;
/*!40000 ALTER TABLE `status_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `status_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `salt` varchar(255) NOT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `country_code` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `birth_day` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `status` tinyint NOT NULL,
  `otp_issued_in` double NOT NULL,
  `role` int NOT NULL,
  `secret_key` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `lang` varchar(255) NOT NULL,
  `mfa` tinyint DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `expired_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@atomp.io','ATOMP Admin','$2a$10$5X.QSkhwLVmZHkP0A9Nd9e','vn',NULL,NULL,NULL,NULL,NULL,2,-1,1,'VX?]zAUFi*u!0.{nqg:Dx0CaM>mSqSGd',NULL,'en',0,'2023-06-12 09:22:10','2022-06-12 09:22:10',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_failed_logins`
--

DROP TABLE IF EXISTS `users_failed_logins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_failed_logins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `users_failed_logins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_failed_logins`
--

LOCK TABLES `users_failed_logins` WRITE;
/*!40000 ALTER TABLE `users_failed_logins` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_failed_logins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_passwords`
--

DROP TABLE IF EXISTS `users_passwords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_passwords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `hash_password` varchar(255) NOT NULL,
  `status` tinyint NOT NULL,
  `expired_at` double DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `users_passwords_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_passwords`
--

LOCK TABLES `users_passwords` WRITE;
/*!40000 ALTER TABLE `users_passwords` DISABLE KEYS */;
INSERT INTO `users_passwords` VALUES (1,1,'$2a$10$5X.QSkhwLVmZHkP0A9Nd9ecHkJ3jVneJkbuYf7dnHc8RlGw5qgQTi',2,NULL,'2023-06-12 09:22:10','2023-06-13 02:28:16');
/*!40000 ALTER TABLE `users_passwords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_sessions`
--

DROP TABLE IF EXISTS `users_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `expired_at` double DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `users_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_sessions`
--

LOCK TABLES `users_sessions` WRITE;
/*!40000 ALTER TABLE `users_sessions` DISABLE KEYS */;
INSERT INTO `users_sessions` VALUES ('047f25546feed01b6055b1c8ce71081f34f09e8594b0742b966ed97ef07c7764',1,1.7763229210653153e23,'2026-04-16 07:02:01','2026-04-16 07:02:01'),('113977f978a1fae48fa4106d677865db75d6e372835c883e0b524b9623617bb1',1,1.6865572985083153e23,'2023-06-12 08:08:18','2023-06-12 08:08:18'),('41e797566bdf70bc5bf36f41a7bd922f094f795eb5ce6bd29322fe9cc7d9de0e',1,1.6949260210913155e23,'2023-09-17 04:47:01','2023-09-17 04:47:01'),('56039b47b4242f13f5a9ad9772a3543d74c1e1b0278933d796263ea552c9d101',1,1.6903661727743153e23,'2023-07-26 10:09:32','2023-07-26 10:09:32'),('59898f662e52ab33822802f163d9672dcebbb1d68e4c3bd701cedcb3bf8ac219',1,1.7763228609893153e23,'2026-04-16 07:01:01','2026-04-16 07:01:01'),('666fe01f44c24d612a228abc8a50174d4b18af102051c5c27085d20981628e5d',1,1.6898388278663155e23,'2023-07-20 07:40:27','2023-07-20 07:40:27'),('83280956f4bedd6ac96d9299ca346643422fbe35953d15ba480cf83c8481b751',1,1.6949264020403155e23,'2023-09-17 04:53:22','2023-09-17 04:53:22'),('bb8466692acd54a04873066f2a89e3c3a8169ac0d96a6dd073f886d36d9faa02',1,1.6898386869873154e23,'2023-07-20 07:38:07','2023-07-20 07:38:07'),('bbf132b0ad0b0a2dc1862a598c6469020dcf4d5fdb26a0b47bedc6aa58066599',1,1.6867297262733153e23,'2023-06-14 08:02:06','2023-06-14 08:02:06'),('c629184d06606b61eab85b847cd36e61428d73456735a186fae20774ece34429',1,1.6865621984243154e23,'2023-06-12 09:29:58','2023-06-12 09:29:58'),('cf03e05c10fa829a8eebb1fcc5b6adf0ce9bc9680da1d215f2b759ff4d6bdf0e',1,1.6898385177063152e23,'2023-07-20 07:35:17','2023-07-20 07:35:17'),('d5f3aaa813e12629fefae478f842af8c6fe79fe94adcae1fb2ab13cc9b8e62c1',1,1.6866232964723153e23,'2023-06-13 02:28:16','2023-06-13 02:28:16'),('d7bcfd5196babd8c7b3d127e96434b5d9d442b8dca2efd1d524e65edaeb3c4fc',1,1.6898393182793152e23,'2023-07-20 07:48:38','2023-07-20 07:48:38'),('e3fd423035bf34d69e34fceee834004448d33479a4a40006a06ee452f12bb166',1,1.6898390534493155e23,'2023-07-20 07:44:13','2023-07-20 07:44:13'),('e56ea6622c428acebde37817e72792e157e4b81f2b859d8ffbbad40359c6ace3',1,1.6898398996513155e23,'2023-07-20 07:58:19','2023-07-20 07:58:19'),('ed30fcde993d771a08c73bd96dfa85110f3b4c23dd937a2bc281fe50a4494c09',1,1.6889599759523152e23,'2023-07-10 03:32:56','2023-07-10 03:32:56'),('f2d14ee0c190cf64ae877da3ba7171d3fc0de30d0f43e3d005a50de3a40b1dd2',1,1.6948739675283153e23,'2023-09-16 14:19:27','2023-09-16 14:19:27'),('f4c1d8019d4048eebe35988b0ca4fbcd18ad27bc1c110a75d09db9460d01381f',1,1.6865618623623153e23,'2023-06-12 09:24:22','2023-06-12 09:24:22'),('f7a623fbc9d5b90597f3dba10df453ee3dda1072417ea68ed9a9bc621a54c5ea',1,1.6866233104553155e23,'2023-06-13 02:28:30','2023-06-13 02:28:30');
/*!40000 ALTER TABLE `users_sessions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-16  7:04:48
