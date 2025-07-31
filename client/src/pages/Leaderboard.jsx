import React, { useEffect, useState } from 'react';
import axios from 'axios';

// API 클라이언트 생성
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
});

/**
 * 소셜 크레딧 상위 10명의 랭킹을 테이블로 보여주는 페이지
 */
function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 서버에서 랭킹 정보를 가져온다.
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaderboard');
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}
      <table className="min-w-full border text-center">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">순위</th>
            <th className="border px-2 py-1">닉네임</th>
            <th className="border px-2 py-1">점수</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr key={u.id} className="hover:bg-gray-100">
              <td className="border px-2 py-1">{idx + 1}</td>
              <td className="border px-2 py-1">{u.username}</td>
              <td className="border px-2 py-1">{u.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
