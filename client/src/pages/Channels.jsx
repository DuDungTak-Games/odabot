import React, { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api' });

function Channels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/channels');
      setChannels(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeChannel = async (id) => {
    try {
      await api.delete(`/channels/${id}`);
      setChannels((prev) => prev.filter((c) => c.channelId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">등록된 채널</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}
      <ul className="space-y-2">
        {channels.map((c) => (
          <li key={c.channelId} className="flex justify-between items-center p-2 border rounded">
            <span>{c.guildId}:{c.channelId}</span>
            <button
              className="text-sm text-white bg-red-500 px-2 py-1 rounded"
              onClick={() => removeChannel(c.channelId)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Channels;
