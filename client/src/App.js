import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  // API 클라이언트 설정
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // 타임라인 메시지 조회
  const fetchTimeline = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/timeline?page=${page}&limit=${limit}`);
      setMessages(response.data.data.messages || []);
    } catch (err) {
      setError('타임라인을 불러오는데 실패했습니다: ' + err.message);
      console.error('Timeline fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 랜덤 메시지 조회
  const fetchRandom = async (count = 5) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/random?count=${count}`);
      setMessages(response.data.data.messages || []);
    } catch (err) {
      setError('랜덤 메시지를 불러오는데 실패했습니다: ' + err.message);
      console.error('Random fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 통계 조회
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/stats');
      setStats(response.data.data || null);
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다: ' + err.message);
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // API 연결 테스트
  const testConnection = async () => {
    try {
      const response = await axios.get('http://localhost:3001/health');
      console.log('API 연결 테스트 성공:', response.data);
    } catch (err) {
      console.error('API 연결 테스트 실패:', err.message);
    }
  };

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeline();
    } else if (activeTab === 'random') {
      fetchRandom();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 메시지 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 ODA Bot Dashboard</h1>
        <p>Discord Bot + Express API + React Frontend</p>
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === 'timeline' ? 'active' : ''}
          onClick={() => setActiveTab('timeline')}
        >
          📄 타임라인
        </button>
        <button 
          className={activeTab === 'random' ? 'active' : ''}
          onClick={() => setActiveTab('random')}
        >
          🎲 랜덤 메시지
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 통계
        </button>
      </nav>

      <main className="main-content">
        {loading && <div className="loading">로딩 중...</div>}
        {error && <div className="error">오류: {error}</div>}

        {/* 타임라인 탭 */}
        {activeTab === 'timeline' && (
          <div className="timeline-tab">
            <div className="tab-header">
              <h2>📄 최근 메시지</h2>
              <button onClick={() => fetchTimeline()} disabled={loading}>
                새로고침
              </button>
            </div>
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className="message-item">
                  <div className="message-header">
                    <img 
                      src={message.avatar_url || '/default-avatar.png'} 
                      alt={message.username}
                      className="avatar"
                      onError={(e) => {e.target.src = '/default-avatar.png'}}
                    />
                    <span className="username">{message.username}</span>
                    <span className="timestamp">{formatDate(message.created_at)}</span>
                  </div>
                  <div className="message-content">
                    {message.message && <p>{message.message}</p>}
                    {message.attachment_url && (
                      <img 
                        src={message.attachment_url} 
                        alt="첨부파일" 
                        className="attachment"
                        onError={(e) => {e.target.style.display = 'none'}}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 랜덤 메시지 탭 */}
        {activeTab === 'random' && (
          <div className="random-tab">
            <div className="tab-header">
              <h2>🎲 랜덤 메시지</h2>
              <button onClick={() => fetchRandom()} disabled={loading}>
                새로운 랜덤 메시지
              </button>
            </div>
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className="message-item">
                  <div className="message-header">
                    <img 
                      src={message.avatar_url || '/default-avatar.png'} 
                      alt={message.username}
                      className="avatar"
                      onError={(e) => {e.target.src = '/default-avatar.png'}}
                    />
                    <span className="username">{message.username}</span>
                    <span className="timestamp">{formatDate(message.created_at)}</span>
                  </div>
                  <div className="message-content">
                    {message.message && <p>{message.message}</p>}
                    {message.attachment_url && (
                      <img 
                        src={message.attachment_url} 
                        alt="첨부파일" 
                        className="attachment"
                        onError={(e) => {e.target.style.display = 'none'}}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통계 탭 */}
        {activeTab === 'stats' && stats && (
          <div className="stats-tab">
            <div className="tab-header">
              <h2>📊 서버 통계</h2>
              <button onClick={() => fetchStats()} disabled={loading}>
                새로고침
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>전체 현황</h3>
                <p>총 메시지: {stats.overview?.totalMessages || 0}</p>
                <p>총 사용자: {stats.overview?.totalUsers || 0}</p>
                <p>첨부파일: {stats.overview?.messagesWithAttachments || 0}</p>
                <p>텍스트만: {stats.overview?.textOnlyMessages || 0}</p>
              </div>
              <div className="stat-card">
                <h3>활동 현황</h3>
                <p>오늘: {stats.activity?.today || 0}</p>
                <p>이번 주: {stats.activity?.thisWeek || 0}</p>
                <p>이번 달: {stats.activity?.thisMonth || 0}</p>
              </div>
              <div className="stat-card">
                <h3>시간 정보</h3>
                <p>최신 메시지: {stats.timeline?.latestMessage ? formatDate(stats.timeline.latestMessage) : 'N/A'}</p>
                <p>첫 메시지: {stats.timeline?.oldestMessage ? formatDate(stats.timeline.oldestMessage) : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && messages.length === 0 && activeTab !== 'stats' && (
          <div className="no-data">
            데이터가 없습니다. 서버가 실행 중인지 확인해주세요.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
