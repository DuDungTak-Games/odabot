-- 크레딧 규칙 테이블 생성
CREATE TABLE IF NOT EXISTS credit_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('plus', 'minus') NOT NULL,
    value INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_word (word)
);

-- 기존 creditRules.json 데이터를 테이블에 삽입
INSERT IGNORE INTO credit_rules (word, type, value) VALUES
('고맙다', 'plus', 1),
('수고', 'plus', 1),
('멋지다', 'plus', 1),
('멍청이', 'minus', 1),
('바보', 'minus', 1),
('꺼져', 'minus', 1);
