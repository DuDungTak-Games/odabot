-- 크레딧 반응 메시지 및 이미지 테이블 생성
CREATE TABLE IF NOT EXISTS credit_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('plus', 'minus') NOT NULL,
    message TEXT NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_active (is_active)
);

-- 기본 반응 메시지들 삽입
INSERT INTO credit_reactions (type, message, image_url) VALUES
-- Plus 반응들
('plus', '잘했어요! 👏', 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'),
('plus', '훌륭해요! ✨', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'),
('plus', '멋져요! 🌟', 'https://media.giphy.com/media/26u4cqzOzJQpxK7Dy/giphy.gif'),
('plus', '좋은 말이에요! 😊', 'https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif'),
('plus', '포지티브! 💖', 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif'),

-- Minus 반응들
('minus', '좀 더 좋은 말을 써보세요! 😅', 'https://media.giphy.com/media/l2Je66zG6mAAZxgqI/giphy.gif'),
('minus', '그런 말은 안 좋아요! 😔', 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif'),
('minus', '더 친절하게 말해주세요! 🙏', 'https://media.giphy.com/media/l0MYu38R0PPhIXe36/giphy.gif'),
('minus', '나쁜 말은 그만! ✋', 'https://media.giphy.com/media/26FLgGTPUDH6UGAbm/giphy.gif'),
('minus', '좀 더 긍정적으로! 😌', 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif');
