const express = require('express');
const router = express.Router();

// 전체 통계 조회
router.get('/', async (req, res) => {
    try {
        // 전체 메시지 수
        const [totalMessagesResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM messages'
        );

        // 전체 사용자 수
        const [totalUsersResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM users'
        );

        // 첨부파일이 있는 메시지 수
        const [messagesWithAttachmentsResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE attachments IS NOT NULL'
        );

        // 텍스트만 있는 메시지 수
        const [textOnlyMessagesResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE content IS NOT NULL AND content != "" AND attachments IS NULL'
        );

        // 오늘 메시지 수
        const [todayMessagesResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE DATE(created_at) = CURDATE()'
        );

        // 이번 주 메시지 수
        const [weekMessagesResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)'
        );

        // 이번 달 메시지 수
        const [monthMessagesResult] = await req.db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())'
        );

        // 최신 메시지 시간
        const [latestMessageResult] = await req.db.execute(
            'SELECT created_at FROM messages ORDER BY created_at DESC LIMIT 1'
        );

        // 가장 오래된 메시지 시간
        const [oldestMessageResult] = await req.db.execute(
            'SELECT created_at FROM messages ORDER BY created_at ASC LIMIT 1'
        );

        res.json({
            success: true,
            data: {
                overview: {
                    totalMessages: totalMessagesResult[0].total,
                    totalUsers: totalUsersResult[0].total,
                    messagesWithAttachments: messagesWithAttachmentsResult[0].total,
                    textOnlyMessages: textOnlyMessagesResult[0].total
                },
                activity: {
                    today: todayMessagesResult[0].total,
                    thisWeek: weekMessagesResult[0].total,
                    thisMonth: monthMessagesResult[0].total
                },
                timeline: {
                    latestMessage: latestMessageResult[0]?.created_at || null,
                    oldestMessage: oldestMessageResult[0]?.created_at || null
                }
            }
        });
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 사용자별 통계 조회
router.get('/users', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const actualLimit = Math.min(limit, 50); // 최대 50명까지

        const query = `
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                COUNT(m.id) as message_count,
                COUNT(CASE WHEN m.attachments IS NOT NULL THEN 1 END) as attachment_count,
                COUNT(CASE WHEN m.content IS NOT NULL AND m.content != '' THEN 1 END) as text_count,
                MAX(m.created_at) as last_message_at,
                MIN(m.created_at) as first_message_at
            FROM users u
            LEFT JOIN messages m ON u.id = m.user_id
            GROUP BY u.id, u.username, u.avatar_url
            HAVING message_count > 0
            ORDER BY message_count DESC
            LIMIT ${actualLimit}
        `;

        const [users] = await req.db.execute(query);

        res.json({
            success: true,
            data: {
                users,
                count: users.length,
                limit: actualLimit
            }
        });
    } catch (error) {
        console.error('사용자별 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '사용자별 통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 일별 메시지 통계 (최근 30일)
router.get('/daily', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const actualDays = Math.min(days, 365); // 최대 1년

        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as message_count,
                COUNT(DISTINCT user_id) as active_users,
                COUNT(CASE WHEN attachments IS NOT NULL THEN 1 END) as attachment_count
            FROM messages
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const [dailyStats] = await req.db.execute(query, [actualDays]);

        res.json({
            success: true,
            data: {
                dailyStats,
                period: `${actualDays}일`,
                count: dailyStats.length
            }
        });
    } catch (error) {
        console.error('일별 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '일별 통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 시간대별 메시지 통계
router.get('/hourly', async (req, res) => {
    try {
        const query = `
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as message_count,
                COUNT(DISTINCT user_id) as active_users
            FROM messages
            GROUP BY HOUR(created_at)
            ORDER BY hour
        `;

        const [hourlyStats] = await req.db.execute(query);

        // 0-23시간 모든 시간대를 포함하여 빈 시간대는 0으로 채우기
        const fullHourlyStats = [];
        for (let hour = 0; hour < 24; hour++) {
            const existingStat = hourlyStats.find(stat => stat.hour === hour);
            fullHourlyStats.push({
                hour,
                message_count: existingStat ? existingStat.message_count : 0,
                active_users: existingStat ? existingStat.active_users : 0
            });
        }

        res.json({
            success: true,
            data: {
                hourlyStats: fullHourlyStats
            }
        });
    } catch (error) {
        console.error('시간대별 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '시간대별 통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 특정 사용자 상세 통계
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 사용자 기본 정보 및 통계
        const [userStatsResult] = await req.db.execute(`
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.created_at as joined_at,
                COUNT(m.id) as total_messages,
                COUNT(CASE WHEN m.attachments IS NOT NULL THEN 1 END) as attachment_count,
                COUNT(CASE WHEN m.content IS NOT NULL AND m.content != '' THEN 1 END) as text_count,
                MAX(m.created_at) as last_message_at,
                MIN(m.created_at) as first_message_at,
                AVG(CHAR_LENGTH(m.content)) as avg_message_length
            FROM users u
            LEFT JOIN messages m ON u.id = m.user_id
            WHERE u.id = ?
            GROUP BY u.id, u.username, u.avatar_url, u.created_at
        `, [userId]);

        if (userStatsResult.length === 0) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }

        // 사용자의 일별 활동 (최근 30일)
        const [dailyActivityResult] = await req.db.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as message_count
            FROM messages
            WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [userId]);

        // 사용자의 시간대별 활동
        const [hourlyActivityResult] = await req.db.execute(`
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as message_count
            FROM messages
            WHERE user_id = ?
            GROUP BY HOUR(created_at)
            ORDER BY hour
        `, [userId]);

        res.json({
            success: true,
            data: {
                user: userStatsResult[0],
                dailyActivity: dailyActivityResult,
                hourlyActivity: hourlyActivityResult
            }
        });
    } catch (error) {
        console.error('사용자 상세 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '사용자 상세 통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
