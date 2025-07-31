-- ODA Bot Database Schema
-- 사용법: mysql -u root -p odabot < server/db/schema.sql

-- 데이터베이스 생성 (이미 존재하는 경우 무시)
CREATE DATABASE IF NOT EXISTS odabot 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE odabot;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY COMMENT 'Discord 사용자 ID',
    username VARCHAR(255) NOT NULL COMMENT 'Discord 사용자명',
    avatar_url VARCHAR(500) COMMENT 'Discord 아바타 URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='Discord 사용자 정보';

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '메시지 고유 ID',
    user_id BIGINT NOT NULL COMMENT 'Discord 사용자 ID',
    message TEXT COMMENT '메시지 내용',
    attachment_url VARCHAR(500) COMMENT 'Discord CDN 첨부파일 URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_user_created (user_id, created_at),
    FULLTEXT INDEX idx_message_fulltext (message)
) ENGINE=InnoDB COMMENT='Discord 메시지 저장';

-- Knex 마이그레이션 테이블 (knex가 자동으로 생성하지만 명시적으로 정의)
CREATE TABLE IF NOT EXISTS knex_migrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    batch INT,
    migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Knex 마이그레이션 기록';

CREATE TABLE IF NOT EXISTS knex_migrations_lock (
    index INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    is_locked INT
) ENGINE=InnoDB COMMENT='Knex 마이그레이션 락';

-- 초기 데이터 (선택사항)
-- INSERT INTO users (id, username, avatar_url) VALUES 
-- (123456789012345678, 'TestUser', 'https://cdn.discordapp.com/avatars/123456789012345678/avatar.png')
-- ON DUPLICATE KEY UPDATE username = VALUES(username);

SHOW TABLES;
