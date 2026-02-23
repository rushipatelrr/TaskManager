import { useState, useEffect } from 'react';
import { userService } from '../services/taskService';
import { Spinner } from '../components/common';
import { RiTrophyLine, RiMedalLine, RiStarLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    userService.getLeaderboard()
      .then(({ data }) => setLeaderboard(data.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myRank = leaderboard.findIndex(u => u._id === user?._id) + 1;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-300/30">
          <RiTrophyLine className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Complete tasks to climb the ranks</p>
        {myRank > 0 && (
          <p className="text-brand-600 dark:text-brand-400 font-semibold mt-2">Your rank: #{myRank}</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="xl" /></div>
      ) : (
        <>
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {[1, 0, 2].map((idx) => {
                const u = leaderboard[idx];
                const heights = ['h-24', 'h-32', 'h-20'];
                const heightsByPos = { 0: heights[1], 1: heights[0], 2: heights[2] };
                return u ? (
                  <div key={u._id} className="flex flex-col items-center gap-2">
                    <div className="text-2xl">{medals[idx]}</div>
                    {u.avatar
                      ? <img src={u.avatar} className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" alt="" />
                      : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold border-4 border-white dark:border-gray-800 shadow-lg">{u.name[0]}</div>
                    }
                    <p className="text-sm font-bold text-gray-900 dark:text-white text-center max-w-[80px] truncate">{u.name.split(' ')[0]}</p>
                    <p className="text-xs font-semibold text-amber-600 flex items-center gap-0.5">
                      <RiStarLine className="w-3 h-3" />{u.totalPoints}
                    </p>
                    <div className={`w-20 ${heightsByPos[idx]} rounded-t-xl ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-orange-400'} opacity-80`} />
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Full list */}
          <div className="card overflow-hidden">
            {leaderboard.map((u, i) => {
              const isMe = u._id === user?._id;
              return (
                <div
                  key={u._id}
                  className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 border-gray-100 dark:border-gray-700/50 transition-colors ${
                    isMe ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <span className={`w-8 text-center text-sm font-bold flex-shrink-0 ${i < 3 ? 'text-lg' : 'text-gray-400'}`}>
                    {i < 3 ? medals[i] : i + 1}
                  </span>

                  {u.avatar
                    ? <img src={u.avatar} className="w-10 h-10 rounded-full flex-shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">{u.name[0]}</div>
                  }

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                      {u.name}
                      {isMe && <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-xs">You</span>}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <RiStarLine className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-gray-900 dark:text-white">{u.totalPoints}</span>
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
